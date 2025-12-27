const API_BASE = {
  auth: 'https://functions.poehali.dev/f62b9cac-b374-44fb-acfd-daf9c71b2387',
  posts: 'https://functions.poehali.dev/ee9815f3-6c10-4e4e-aa6a-0cd89ba04dc3',
  messages: 'https://functions.poehali.dev/6c51a9da-ef19-46b2-a11f-b910c6915503',
  groups: 'https://functions.poehali.dev/2170d848-6253-4c95-9f4c-93f06a85eb84'
};

export const api = {
  auth: {
    register: async (data: { phone: string; fullName: string; position: string; password: string }) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...data })
      });
      return response.json();
    },
    login: async (data: { phone: string; password: string }) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...data })
      });
      return response.json();
    },
    updateProfile: async (data: { userId: number; fullName?: string; position?: string; email?: string; birthDate?: string; bio?: string }) => {
      const response = await fetch(API_BASE.auth, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  },
  posts: {
    getAll: async () => {
      const response = await fetch(API_BASE.posts);
      return response.json();
    },
    create: async (data: { userId: number; content: string }) => {
      const response = await fetch(API_BASE.posts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  },
  messages: {
    getAll: async (userId?: number) => {
      const url = userId ? `${API_BASE.messages}?userId=${userId}` : API_BASE.messages;
      const response = await fetch(url);
      return response.json();
    },
    send: async (data: { fromUserId: number; content: string; toUserId?: number }) => {
      const response = await fetch(API_BASE.messages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  },
  groups: {
    getAll: async (userId?: number) => {
      const url = userId ? `${API_BASE.groups}?userId=${userId}` : API_BASE.groups;
      const response = await fetch(url);
      return response.json();
    },
    create: async (data: { userId: number; name: string; description?: string }) => {
      const response = await fetch(API_BASE.groups, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  }
};
