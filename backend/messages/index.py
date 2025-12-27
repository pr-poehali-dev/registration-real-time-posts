import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    API для работы с сообщениями чата.
    Поддерживает отправку и получение сообщений.
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
                    SELECT m.id, m.from_user_id, u.full_name, m.content, m.created_at
                    FROM messages m
                    JOIN users u ON m.from_user_id = u.id
                    WHERE m.to_user_id = %s OR m.from_user_id = %s OR m.to_user_id IS NULL
                    ORDER BY m.created_at DESC
                    LIMIT 100
                """, (user_id, user_id))
            else:
                cur.execute("""
                    SELECT m.id, m.from_user_id, u.full_name, m.content, m.created_at
                    FROM messages m
                    JOIN users u ON m.from_user_id = u.id
                    WHERE m.to_user_id IS NULL
                    ORDER BY m.created_at DESC
                    LIMIT 100
                """)
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'fromUserId': row[1],
                    'fromUserName': row[2],
                    'content': row[3],
                    'timestamp': row[4].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            from_user_id = body.get('fromUserId')
            content = body.get('content')
            to_user_id = body.get('toUserId')
            
            if not all([from_user_id, content]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'От кого и содержимое обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO messages (from_user_id, to_user_id, content) 
                   VALUES (%s, %s, %s) 
                   RETURNING id, created_at""",
                (from_user_id, to_user_id, content)
            )
            result = cur.fetchone()
            conn.commit()
            
            cur.execute("SELECT full_name FROM users WHERE id = %s", (from_user_id,))
            user = cur.fetchone()
            
            message = {
                'id': result[0],
                'fromUserId': from_user_id,
                'fromUserName': user[0],
                'content': content,
                'timestamp': result[1].isoformat()
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': message}),
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
