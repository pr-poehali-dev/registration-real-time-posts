import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  phone: string;
  fullName: string;
  position: string;
  password: string;
  registeredAt: string;
  bio?: string;
  email?: string;
  birthDate?: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPosition: string;
  content: string;
  timestamp: string;
  isModerated: boolean;
}

interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  content: string;
  timestamp: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  posts: Post[];
}

interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'group_invite';
  fromUserId: string;
  fromUserName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [activePanel, setActivePanel] = useState<'profile' | 'chat' | 'groups' | 'notifications' | 'friends' | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState({
    fullName: '',
    email: '',
    birthDate: '',
    bio: '',
    position: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    setEditProfile({
      fullName: user.fullName,
      email: user.email || '',
      birthDate: user.birthDate || '',
      bio: user.bio || '',
      position: user.position
    });

    const savedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
    setPosts(savedPosts);

    const savedMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    setMessages(savedMessages);

    const savedGroups = JSON.parse(localStorage.getItem('groups') || '[]');
    setGroups(savedGroups);

    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(savedNotifications);

    const savedFriends = JSON.parse(localStorage.getItem(`friends_${user.id}`) || '[]');
    setFriends(savedFriends);
  }, [navigate]);

  const handleCreatePost = () => {
    if (!newPost.trim() || !currentUser) return;

    const post: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      userPosition: currentUser.position,
      content: newPost,
      timestamp: new Date().toISOString(),
      isModerated: true
    };

    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
    setNewPost('');
    toast.success('Пост опубликован!');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const message: Message = {
      id: Date.now().toString(),
      fromUserId: currentUser.id,
      fromUserName: currentUser.fullName,
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
    setNewMessage('');
    toast.success('Сообщение отправлено!');
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !currentUser) return;

    const group: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: '',
      createdBy: currentUser.id,
      members: [currentUser.id],
      posts: []
    };

    const updatedGroups = [...groups, group];
    setGroups(updatedGroups);
    localStorage.setItem('groups', JSON.stringify(updatedGroups));
    setNewGroupName('');
    toast.success('Группа создана!');
  };

  const handleUpdateProfile = () => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      ...editProfile
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: User) => u.id === currentUser.id ? updatedUser : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    toast.success('Профиль обновлён!');
    setActivePanel(null);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 gradient-primary">
              <AvatarFallback className="bg-transparent text-white font-bold">
                {getInitials(currentUser.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{currentUser.fullName}</h3>
              <p className="text-xs text-sidebar-foreground/70">{currentUser.position}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActivePanel('profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Icon name="User" size={20} />
            <span className="font-medium">Профиль</span>
          </button>

          <button
            onClick={() => setActivePanel('chat')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Icon name="MessageSquare" size={20} />
            <span className="font-medium">Чат</span>
            {messages.length > 0 && (
              <Badge className="ml-auto gradient-primary text-white border-0">{messages.length}</Badge>
            )}
          </button>

          <button
            onClick={() => setActivePanel('groups')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Icon name="Users" size={20} />
            <span className="font-medium">Группы</span>
            <Badge variant="outline" className="ml-auto">{groups.length}</Badge>
          </button>

          <button
            onClick={() => setActivePanel('friends')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <Icon name="UserPlus" size={20} />
            <span className="font-medium">Друзья</span>
          </button>

          <button
            onClick={() => setActivePanel('notifications')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors relative"
          >
            <Icon name="Bell" size={20} />
            <span className="font-medium">Уведомления</span>
            {unreadNotifications > 0 && (
              <Badge className="ml-auto gradient-primary text-white border-0">
                {unreadNotifications}
              </Badge>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            onClick={() => {
              localStorage.removeItem('currentUser');
              navigate('/');
            }}
            variant="outline"
            className="w-full"
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b sticky top-0 z-10 backdrop-blur-lg bg-white/80">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Лента новостей
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Card className="p-6 gradient-card border-2 border-purple-100">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 gradient-primary flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white font-bold">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Что у вас нового?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none border-2 focus:border-primary"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    className="gradient-primary text-white hover-scale"
                    disabled={!newPost.trim()}
                  >
                    <Icon name="Send" size={18} className="mr-2" />
                    Опубликовать
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow animate-fade-in">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12 gradient-primary flex-shrink-0">
                    <AvatarFallback className="bg-transparent text-white font-bold">
                      {getInitials(post.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{post.userName}</h4>
                        <p className="text-sm text-muted-foreground">{post.userPosition}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    <div className="flex gap-4 pt-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Icon name="ThumbsUp" size={16} className="mr-1" />
                        Нравится
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Icon name="MessageCircle" size={16} className="mr-1" />
                        Комментировать
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {posts.length === 0 && (
              <Card className="p-12 text-center">
                <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Пока нет постов</h3>
                <p className="text-muted-foreground">Будьте первым, кто поделится новостью!</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Sheet open={activePanel === 'profile'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Редактировать профиль</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 gradient-primary">
                <AvatarFallback className="bg-transparent text-white font-bold text-3xl">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-fullName">ФИО</Label>
                <Input
                  id="edit-fullName"
                  value={editProfile.fullName}
                  onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-position">Должность</Label>
                <Input
                  id="edit-position"
                  value={editProfile.position}
                  onChange={(e) => setEditProfile({ ...editProfile, position: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-birthDate">Дата рождения</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={editProfile.birthDate}
                  onChange={(e) => setEditProfile({ ...editProfile, birthDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-bio">О себе</Label>
                <Textarea
                  id="edit-bio"
                  value={editProfile.bio}
                  onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button onClick={handleUpdateProfile} className="w-full gradient-primary text-white">
                Сохранить изменения
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'chat'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Чат</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.fromUserId === currentUser.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-10 w-10 gradient-primary flex-shrink-0">
                  <AvatarFallback className="bg-transparent text-white text-sm font-bold">
                    {getInitials(msg.fromUserName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${msg.fromUserId === currentUser.id ? 'text-right' : ''}`}>
                  <p className="text-sm font-medium mb-1">{msg.fromUserName}</p>
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      msg.fromUserId === currentUser.id
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(msg.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <Textarea
              placeholder="Написать сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
            />
            <Button onClick={handleSendMessage} className="w-full gradient-primary text-white" disabled={!newMessage.trim()}>
              <Icon name="Send" size={18} className="mr-2" />
              Отправить
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'groups'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Группы</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-group">Создать новую группу</Label>
              <div className="flex gap-2">
                <Input
                  id="new-group"
                  placeholder="Название группы"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button onClick={handleCreateGroup} className="gradient-primary text-white" disabled={!newGroupName.trim()}>
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {groups.map((group) => (
                <Card key={group.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                      <Icon name="Users" size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">{group.members.length} участников</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'notifications'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Уведомления</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Bell" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Нет новых уведомлений</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Card key={notif.id} className={`p-4 ${notif.isRead ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Icon name="Bell" size={20} className="text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{notif.fromUserName}</p>
                      <p className="text-sm text-muted-foreground">{notif.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.timestamp)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'friends'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Друзья</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="UserPlus" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">У вас пока нет друзей</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friendId) => (
                  <Card key={friendId} className="p-4">
                    <p>Друг #{friendId}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
