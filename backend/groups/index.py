import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    API для работы с группами.
    Поддерживает создание групп и получение списка групп.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('userId')
            
            if user_id:
                cur.execute("""
                    SELECT g.id, g.name, g.description, g.created_by, 
                           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
                    FROM groups g
                    LEFT JOIN group_members gm ON g.id = gm.group_id
                    WHERE gm.user_id = %s OR g.created_by = %s
                    GROUP BY g.id
                    ORDER BY g.created_at DESC
                """, (user_id, user_id))
            else:
                cur.execute("""
                    SELECT g.id, g.name, g.description, g.created_by,
                           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
                    FROM groups g
                    ORDER BY g.created_at DESC
                    LIMIT 50
                """)
            
            groups = []
            for row in cur.fetchall():
                groups.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2] or '',
                    'createdBy': row[3],
                    'memberCount': row[4]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'groups': groups}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            description = body.get('description', '')
            user_id = body.get('userId')
            
            if not all([name, user_id]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Название и User ID обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO groups (name, description, created_by) 
                   VALUES (%s, %s, %s) 
                   RETURNING id, created_at""",
                (name, description, user_id)
            )
            result = cur.fetchone()
            group_id = result[0]
            
            cur.execute(
                "INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)",
                (group_id, user_id)
            )
            conn.commit()
            
            group = {
                'id': group_id,
                'name': name,
                'description': description,
                'createdBy': user_id,
                'memberCount': 1
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'group': group}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
