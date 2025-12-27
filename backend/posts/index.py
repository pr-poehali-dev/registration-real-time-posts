import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    API для работы с постами.
    Поддерживает создание, получение и модерацию постов.
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
            cur.execute("""
                SELECT p.id, p.user_id, u.full_name, u.position, p.content, p.is_moderated, p.created_at
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.is_moderated = true
                ORDER BY p.created_at DESC
                LIMIT 50
            """)
            
            posts = []
            for row in cur.fetchall():
                posts.append({
                    'id': row[0],
                    'userId': row[1],
                    'userName': row[2],
                    'userPosition': row[3],
                    'content': row[4],
                    'isModerated': row[5],
                    'timestamp': row[6].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'posts': posts}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            content = body.get('content')
            
            if not all([user_id, content]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID и содержимое обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO posts (user_id, content, is_moderated) 
                   VALUES (%s, %s, true) 
                   RETURNING id, created_at""",
                (user_id, content)
            )
            result = cur.fetchone()
            conn.commit()
            
            cur.execute(
                "SELECT full_name, position FROM users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            
            post = {
                'id': result[0],
                'userId': user_id,
                'userName': user[0],
                'userPosition': user[1],
                'content': content,
                'isModerated': True,
                'timestamp': result[1].isoformat()
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'post': post}),
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
