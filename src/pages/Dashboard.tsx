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
import { api } from '@/lib/api';

interface User {
  id: number;
  phone: string;
  fullName: string;
  position: string;
  registeredAt: string;
  bio?: string;
  email?: string;
  birthDate?: string;
}

interface Post {
  id: number;
  userId: number;
  userName: string;
  userPosition: string;
  content: string;
  timestamp: string;
  isModerated: boolean;
}

interface Message {
  id: number;
  fromUserId: number;
  fromUserName: string;
  content: string;
  timestamp: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  createdBy: number;
  memberCount: number;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    loadPosts();
    loadMessages(user.id);
    loadGroups(user.id);
  }, [navigate]);

  const loadPosts = async () => {
    try {
      const response = await api.posts.getAll();
      if (response.posts) {
        setPosts(response.posts);
      }
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const response = await api.messages.getAll(userId);
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const loadGroups = async (userId: number) => {
    try {
      const response = await api.groups.getAll(userId);
      if (response.groups) {
        setGroups(response.groups);
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !currentUser) return;

    try {
      const response = await api.posts.create({
        userId: currentUser.id,
        content: newPost
      });

      if (response.post) {
        setPosts([response.post, ...posts]);
        setNewPost('');
        toast.success('Пост опубликован!');
      }
    } catch (error) {
      toast.error('Ошибка публикации поста');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const response = await api.messages.send({
        fromUserId: currentUser.id,
        content: newMessage
      });

      if (response.message) {
        setMessages([...messages, response.message]);
        setNewMessage('');
        toast.success('Сообщение отправлено!');
      }
    } catch (error) {
      toast.error('Ошибка отправки сообщения');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;

    try {
      const response = await api.groups.create({
        userId: currentUser.id,
        name: newGroupName,
        description: ''
      });

      if (response.group) {
        setGroups([...groups, response.group]);
        setNewGroupName('');
        toast.success('Группа создана!');
      }
    } catch (error) {
      toast.error('Ошибка создания группы');
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      const response = await api.auth.updateProfile({
        userId: currentUser.id,
        ...editProfile
      });

      if (response.user) {
        const updatedUser = { ...currentUser, ...response.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        toast.success('Профиль обновлён!');
        setActivePanel(null);
      }
    } catch (error) {
      toast.error('Ошибка обновления профиля');
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg"
      >
        <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} className="text-white" />
      </button>

      <aside className={`
        w-full md:w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col
        fixed md:relative z-40 h-full transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 md:h-12 w-10 md:w-12 gradient-primary flex-shrink-0">
              <AvatarFallback className="bg-transparent text-white font-bold text-sm md:text-base">
                {getInitials(currentUser.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{currentUser.fullName}</h3>
              <p className="text-xs text-sidebar-foreground/70 truncate">{currentUser.position}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActivePanel('profile'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sm md:text-base"
          >
            <Icon name="User" size={20} />
            <span className="font-medium">Профиль</span>
          </button>

          <button
            onClick={() => { setActivePanel('chat'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sm md:text-base"
          >
            <Icon name="MessageSquare" size={20} />
            <span className="font-medium">Чат</span>
            {messages.length > 0 && (
              <Badge className="ml-auto gradient-primary text-white border-0 text-xs">{messages.length}</Badge>
            )}
          </button>

          <button
            onClick={() => { setActivePanel('groups'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sm md:text-base"
          >
            <Icon name="Users" size={20} />
            <span className="font-medium">Группы</span>
            <Badge variant="outline" className="ml-auto text-xs">{groups.length}</Badge>
          </button>

          <button
            onClick={() => { setActivePanel('friends'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sm md:text-base"
          >
            <Icon name="UserPlus" size={20} />
            <span className="font-medium">Друзья</span>
          </button>

          <button
            onClick={() => { setActivePanel('notifications'); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg hover:bg-sidebar-accent transition-colors relative text-sm md:text-base"
          >
            <Icon name="Bell" size={20} />
            <span className="font-medium">Уведомления</span>
          </button>
        </nav>

        <div className="p-3 md:p-4 border-t border-sidebar-border">
          <Button
            onClick={() => {
              localStorage.removeItem('currentUser');
              navigate('/');
            }}
            variant="outline"
            className="w-full text-sm md:text-base"
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <header className="bg-white border-b sticky top-0 z-10 backdrop-blur-lg bg-white/80">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Лента новостей
            </h1>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 gradient-card border-2 border-purple-100">
            <div className="flex gap-3 md:gap-4">
              <Avatar className="h-10 md:h-12 w-10 md:w-12 gradient-primary flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white font-bold text-sm md:text-base">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Что у вас нового?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] md:min-h-[100px] resize-none border-2 focus:border-primary text-sm md:text-base"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    className="gradient-primary text-white hover-scale text-sm md:text-base"
                    disabled={!newPost.trim()}
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    Опубликовать
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3 md:space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow animate-fade-in">
                <div className="flex gap-3 md:gap-4">
                  <Avatar className="h-10 md:h-12 w-10 md:w-12 gradient-primary flex-shrink-0">
                    <AvatarFallback className="bg-transparent text-white font-bold text-sm md:text-base">
                      {getInitials(post.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm md:text-base truncate">{post.userName}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{post.userPosition}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(post.timestamp)}</span>
                    </div>
                    <p className="text-sm md:text-base text-foreground leading-relaxed break-words">{post.content}</p>
                    <div className="flex gap-2 md:gap-4 pt-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary text-xs md:text-sm">
                        <Icon name="ThumbsUp" size={14} className="mr-1" />
                        <span className="hidden sm:inline">Нравится</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary text-xs md:text-sm">
                        <Icon name="MessageCircle" size={14} className="mr-1" />
                        <span className="hidden sm:inline">Комментировать</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {posts.length === 0 && (
              <Card className="p-8 md:p-12 text-center">
                <Icon name="MessageSquare" size={40} className="mx-auto mb-4 text-muted-foreground md:w-12 md:h-12" />
                <h3 className="text-base md:text-lg font-semibold mb-2">Пока нет постов</h3>
                <p className="text-sm md:text-base text-muted-foreground">Будьте первым, кто поделится новостью!</p>
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
              <Avatar className="h-20 md:h-24 w-20 md:w-24 gradient-primary">
                <AvatarFallback className="bg-transparent text-white font-bold text-2xl md:text-3xl">
                  {getInitials(currentUser.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-fullName" className="text-sm md:text-base">ФИО</Label>
                <Input
                  id="edit-fullName"
                  value={editProfile.fullName}
                  onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-position" className="text-sm md:text-base">Должность</Label>
                <Input
                  id="edit-position"
                  value={editProfile.position}
                  onChange={(e) => setEditProfile({ ...editProfile, position: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-email" className="text-sm md:text-base">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-birthDate" className="text-sm md:text-base">Дата рождения</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={editProfile.birthDate}
                  onChange={(e) => setEditProfile({ ...editProfile, birthDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-bio" className="text-sm md:text-base">О себе</Label>
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
          <div className="flex-1 overflow-y-auto py-4 space-y-3 md:space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 md:gap-3 ${msg.fromUserId === currentUser.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 md:h-10 w-8 md:w-10 gradient-primary flex-shrink-0">
                  <AvatarFallback className="bg-transparent text-white text-xs md:text-sm font-bold">
                    {getInitials(msg.fromUserName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 ${msg.fromUserId === currentUser.id ? 'text-right' : ''}`}>
                  <p className="text-xs md:text-sm font-medium mb-1 truncate">{msg.fromUserName}</p>
                  <div
                    className={`inline-block px-3 md:px-4 py-2 rounded-2xl text-sm md:text-base max-w-full break-words ${
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
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="MessageSquare" size={40} className="mx-auto mb-2" />
                <p className="text-sm">Нет сообщений</p>
              </div>
            )}
          </div>
          <div className="border-t pt-4 space-y-2">
            <Textarea
              placeholder="Написать сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="text-sm md:text-base"
            />
            <Button onClick={handleSendMessage} className="w-full gradient-primary text-white" disabled={!newMessage.trim()}>
              <Icon name="Send" size={16} className="mr-2" />
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
              <Label htmlFor="new-group" className="text-sm md:text-base">Создать новую группу</Label>
              <div className="flex gap-2">
                <Input
                  id="new-group"
                  placeholder="Название группы"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="text-sm md:text-base"
                />
                <Button onClick={handleCreateGroup} className="gradient-primary text-white flex-shrink-0" disabled={!newGroupName.trim()}>
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {groups.map((group) => (
                <Card key={group.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 md:w-12 h-10 md:h-12 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Users" size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-base truncate">{group.name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">{group.memberCount} участников</p>
                    </div>
                  </div>
                </Card>
              ))}
              {groups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Users" size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Нет групп</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'notifications'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Уведомления</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="text-center py-12">
              <Icon name="Bell" size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm md:text-base text-muted-foreground">Нет новых уведомлений</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === 'friends'} onOpenChange={() => setActivePanel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Друзья</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <div className="text-center py-12">
              <Icon name="UserPlus" size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm md:text-base text-muted-foreground">У вас пока нет друзей</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
