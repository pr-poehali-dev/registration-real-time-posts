import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """
    API для регистрации и авторизации пользователей.
    Поддерживает регистрацию, вход и обновление профиля.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'register')
            
            if action == 'register':
                phone = body.get('phone')
                full_name = body.get('fullName')
                position = body.get('position', 'Наставник')
                password = body.get('password')
                
                if not all([phone, full_name, password]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь с таким номером уже существует'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO users (phone, full_name, position, password) 
                       VALUES (%s, %s, %s, %s) RETURNING id, phone, full_name, position, registered_at""",
                    (phone, full_name, position, password)
                )
                result = cur.fetchone()
                conn.commit()
                
                user = {
                    'id': result[0],
                    'phone': result[1],
                    'fullName': result[2],
                    'position': result[3],
                    'registeredAt': result[4].isoformat()
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user}),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                phone = body.get('phone')
                password = body.get('password')
                
                if not all([phone, password]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """SELECT id, phone, full_name, position, email, birth_date, bio, registered_at 
                       FROM users WHERE phone = %s AND password = %s""",
                    (phone, password)
                )
                result = cur.fetchone()
                
                if not result:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный номер телефона или пароль'}),
                        'isBase64Encoded': False
                    }
                
                user = {
                    'id': result[0],
                    'phone': result[1],
                    'fullName': result[2],
                    'position': result[3],
                    'email': result[4],
                    'birthDate': result[5].isoformat() if result[5] else None,
                    'bio': result[6],
                    'registeredAt': result[7].isoformat()
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID обязателен'}),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if 'fullName' in body:
                updates.append("full_name = %s")
                params.append(body['fullName'])
            if 'position' in body:
                updates.append("position = %s")
                params.append(body['position'])
            if 'email' in body:
                updates.append("email = %s")
                params.append(body['email'])
            if 'birthDate' in body:
                updates.append("birth_date = %s")
                params.append(body['birthDate'])
            if 'bio' in body:
                updates.append("bio = %s")
                params.append(body['bio'])
            
            if updates:
                updates.append("updated_at = %s")
                params.append(datetime.now())
                params.append(user_id)
                
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, phone, full_name, position, email, birth_date, bio"
                cur.execute(query, params)
                result = cur.fetchone()
                conn.commit()
                
                user = {
                    'id': result[0],
                    'phone': result[1],
                    'fullName': result[2],
                    'position': result[3],
                    'email': result[4],
                    'birthDate': result[5].isoformat() if result[5] else None,
                    'bio': result[6]
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user}),
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
