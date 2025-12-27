import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    position: 'Наставник',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.fullName || !formData.password) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const response = await api.auth.register(formData);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(response.user));
      toast.success('Регистрация успешна!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Ошибка регистрации. Попробуйте позже.');
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-8 border border-white/20">
          <div className="text-center mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-16 md:h-16 gradient-primary rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg hover-scale">
              <Icon name="Users" size={24} className="text-white md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Регистрация
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">Создайте аккаунт для доступа к платформе</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs md:text-sm font-medium">
                Номер телефона *
              </Label>
              <div className="relative">
                <Icon name="Phone" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground md:w-[18px] md:h-[18px]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-9 md:pl-10 h-10 md:h-12 border-2 focus:border-primary transition-colors text-sm md:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs md:text-sm font-medium">
                ФИО *
              </Label>
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground md:w-[18px] md:h-[18px]" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-9 md:pl-10 h-10 md:h-12 border-2 focus:border-primary transition-colors text-sm md:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs md:text-sm font-medium">
                Должность
              </Label>
              <div className="relative">
                <Icon name="Briefcase" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground md:w-[18px] md:h-[18px]" />
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="pl-9 md:pl-10 h-10 md:h-12 border-2 focus:border-primary transition-colors text-sm md:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs md:text-sm font-medium">
                Пароль *
              </Label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground md:w-[18px] md:h-[18px]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Минимум 6 символов"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 md:pl-10 pr-10 md:pr-12 h-10 md:h-12 border-2 focus:border-primary transition-colors text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 md:h-12 gradient-primary text-white font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all hover-scale"
            >
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-4 md:mt-6 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary font-semibold hover:underline"
              >
                Войти
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}