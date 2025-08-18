class SessionManager {
  constructor() {
    this.user = null;
    this.apiBaseUrl = 'https://inventariolabsapi.uttn.app/api';
    this.init();
  }

  // Inicializar el gestor de sesión
  init() {
    console.log('=== INIT SESSION MANAGER ===');
    this.loadUserFromSession();
    const isValid = this.checkSessionValidity();
    console.log('Sesión válida:', isValid);

    if (isValid) {
      console.log('Llamando updateUserInterface...');
      this.updateUserInterface();
    } else {
      console.log('Sesión no válida, no se actualiza UI');
    }
    console.log('=== FIN INIT SESSION MANAGER ===');
  }

  // Método principal de login
  async login(email, password) {
    try {
      console.log('Iniciando proceso de login para:', email);
      
      // Obtener todos los usuarios
      const response = await fetch(`${this.apiBaseUrl}/users`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const users = await response.json();
      console.log('Usuarios obtenidos:', users.length);

      // Buscar usuario por email y password
      const user = users.find(u => 
        u.email === email && u.password === password
      );

      if (!user) {
        throw new Error('Credenciales incorrectas');
      }

      // Guardar usuario en sesión
      this.user = user;
      this.saveUserToSession(user);
      
      console.log('Login exitoso para:', user.name);
      
      // Actualizar interfaz
      this.updateUserInterface();
      
      return {
        success: true,
        user: user,
        message: 'Login exitoso'
      };

    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      };
    }
  }

  // Guardar usuario en sessionStorage
  saveUserToSession(user) {
    try {
      const userData = JSON.stringify(user);
      sessionStorage.setItem("usuario", userData);
      console.log("Usuario guardado en sesión:", user.name);
    } catch (error) {
      console.error("Error al guardar usuario en sesión:", error);
    }
  }

  // Cargar usuario desde sessionStorage
  loadUserFromSession() {
    const userData = sessionStorage.getItem("usuario");
    if (userData) {
      try {
        this.user = JSON.parse(userData);
        console.log("Usuario cargado desde sesión:", this.user.name);
      } catch (error) {
        console.error("Error al parsear datos de usuario:", error);
        this.clearSession();
      }
    }
  }

  // Verificar si la sesión es válida
  checkSessionValidity() {
    // Si no hay usuario en sesión, redirigir al login (excepto si ya estamos en login)
    if (!this.user && !window.location.pathname.includes('login.html')) {
      console.log("No hay sesión activa, redirigiendo al login");
      window.location.href = 'login.html';
      return false;
    }

    // Verificar que el usuario tenga los datos necesarios
    if (this.user && (!this.user.id_user || !this.user.name || !this.user.email)) {
      console.warn("Datos de usuario incompletos, limpiando sesión");
      this.clearSession();
      return false;
    }

    return true;
  }

  // Actualizar la interfaz de usuario con los datos de la sesión
  updateUserInterface() {
    console.log('=== updateUserInterface llamada ===');
    console.log('Usuario actual:', this.user);

    if (!this.user) {
      console.log('No hay usuario, saliendo de updateUserInterface');
      return;
    }

    // Actualizar el nombre del usuario en el header
    this.updateUserName();

    // Ocultar la imagen de perfil por defecto ya que no hay fotos implementadas
    this.hideProfileImage();

    // Mostrar/Ocultar los enlaces según el rol
    console.log('Llamando a toggleRoleBasedElements...');
    this.toggleRoleBasedElements();

    console.log('=== Fin updateUserInterface ===');
  }

  // Actualizar el nombre del usuario en el header
  updateUserName() {
    const userNameElement = document.querySelector('.user-box span');
    if (userNameElement && this.user.name) {
      userNameElement.textContent = this.user.name;
      console.log("Nombre de usuario actualizado:", this.user.name);
    }
  }

  // Ocultar/modificar la imagen de perfil
  hideProfileImage() {
    const profileImg = document.querySelector('.user-box img');
    if (profileImg) {
      // Usar una imagen por defecto o un avatar genérico
      profileImg.style.display = 'none';

      // Opcional: Agregar iniciales del usuario como alternativa
      this.addUserInitials();
    }
  }

  // Agregar iniciales del usuario como alternativa a la foto
  addUserInitials() {
    const userBox = document.querySelector('.user-box');
    const existingInitials = userBox.querySelector('.user-initials');

    // No crear si ya existe
    if (existingInitials || !this.user.name) return;

    const initials = this.getUserInitials(this.user.name);
    const initialsElement = document.createElement('div');
    initialsElement.className = 'user-initials';
    initialsElement.textContent = initials;
    initialsElement.style.cssText = `
      width: 35px;
      height: 35px;
      background-color: #007bff;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      margin-right: 8px;
    `;

    // Insertar antes del nombre
    const userName = userBox.querySelector('span');
    if (userName) {
      userBox.insertBefore(initialsElement, userName);
    }
  }

  // Obtener las iniciales del nombre del usuario
  getUserInitials(name) {
    if (!name) return 'U';

    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else {
      return names[0][0].toUpperCase();
    }
  }

  // Obtener información del usuario actual
  getCurrentUser() {
    return this.user;
  }

  // Verificar si hay una sesión activa
  isLoggedIn() {
    return this.user !== null;
  }

  // Obtener datos actualizados del usuario desde la API
  async refreshUserData() {
    if (!this.user || !this.user.id_user) return false;

    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${this.user.id_user}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json();

      // Actualizar los datos en memoria y en sessionStorage
      this.user = updatedUser;
      this.saveUserToSession(updatedUser);

      // Actualizar la interfaz
      this.updateUserInterface();

      console.log("Datos de usuario actualizados:", updatedUser);
      return true;

    } catch (error) {
      console.error("Error al actualizar datos del usuario:", error);
      return false;
    }
  }

  // Limpiar la sesión
  clearSession() {
    this.user = null;
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("rememberMe");
  }

  // Cerrar sesión
  logout() {
    console.log("Cerrando sesión del usuario:", this.user?.name);

    // Marcar que se hizo logout para evitar auto-login
    localStorage.setItem("wasLoggedOut", "true");
    localStorage.removeItem("manualLogin");

    this.clearSession();

    // Redirigir al login
    window.location.href = 'login.html';
  }

  // Verificar permisos de rol
  hasRole(roleId) {
    console.log('=== hasRole Debug ===');
    console.log('roleId buscado:', roleId);
    console.log('this.user:', this.user);
    console.log('this.user.RoleInfo:', this.user?.RoleInfo);
    console.log('this.user.RoleInfo.id_rol:', this.user?.RoleInfo?.id_rol);

    const result = this.user && this.user.RoleInfo && this.user.RoleInfo.id_rol === roleId;
    console.log('Resultado hasRole:', result);
    console.log('=== Fin hasRole Debug ===');

    return result;
  }

  // Verificar si es master (rol 1)
  isMaster() {
    return this.hasRole(1);
  }

  // Verificar si es administrador (rol 4)
  isAdmin() {
    return this.hasRole(4);
  }

  // Obtener información del rol actual
  getCurrentRole() {
    if (!this.user || !this.user.RoleInfo) {
      return null;
    }
    return {
      id: this.user.RoleInfo.id_rol,
      name: this.user.RoleInfo.rol1 || this.user.RoleInfo.rol
    };
  }

  // Mostrar/Ocultar elementos según el rol
  toggleRoleBasedElements() {
    console.log('=== INICIO toggleRoleBasedElements ===');

    // Verificar datos del usuario
    console.log('Usuario completo:', this.user);
    console.log('RoleInfo:', this.user?.RoleInfo);
    console.log('id_rol:', this.user?.RoleInfo?.id_rol);

    const currentRole = this.getCurrentRole();
    console.log('Rol actual:', currentRole);

    // Elementos para diferentes roles
    this.toggleElementsByRole('admin-link', 4); // Elementos solo para admin
    this.toggleElementsByRole('master-link', 1); // Elementos solo para master
    this.toggleElementsByRole('user-link', [1, 2, 3, 4]); // Elementos para usuarios normales

    // Agregar clase CSS al body según el rol
    document.body.className = document.body.className.replace(/user-role-\d+/g, '');
    if (currentRole) {
      document.body.classList.add(`user-role-${currentRole.id}`);
    }

    console.log('=== FIN toggleRoleBasedElements ===');
  }

  // Función auxiliar para mostrar/ocultar elementos por rol
  toggleElementsByRole(className, allowedRoles) {
    const elements = document.querySelectorAll(`.${className}`);
    const userRole = this.user?.RoleInfo?.id_rol;
    
    // Convertir allowedRoles a array si no lo es
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const shouldShow = roles.includes(userRole);

    console.log(`Procesando .${className} - Rol usuario: ${userRole}, Roles permitidos:`, roles, 'Mostrar:', shouldShow);

    elements.forEach((element, index) => {
      console.log(`--- Procesando elemento .${className} ${index} ---`);
      console.log('Contenido:', element.textContent.trim());

      if (shouldShow) {
        element.style.setProperty('display', 'list-item', 'important');
        element.classList.add('show');
        element.classList.remove('role-hidden');
        element.setAttribute('aria-hidden', 'false');
        console.log('Elemento mostrado');
      } else {
        element.style.setProperty('display', 'none', 'important');
        element.classList.remove('show');
        element.classList.add('role-hidden');
        element.setAttribute('aria-hidden', 'true');
        console.log('Elemento ocultado');
      }
    });
  }

  // Verificar si el usuario puede acceder a una página específica
  canAccessPage(requiredRoles) {
    const userRole = this.user?.RoleInfo?.id_rol;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
  }

  // Redirigir si no tiene permisos para la página actual
  checkPagePermissions(requiredRoles) {
    if (!this.canAccessPage(requiredRoles)) {
      console.warn('Usuario no tiene permisos para esta página');
      // Redirigir a página de inicio o mostrar error
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
}

// Función global para cerrar sesión (compatible con código existente)
function handleLogout() {
  if (window.sessionManager) {
    window.sessionManager.logout();
  } else {
    // Fallback si no está inicializado
    localStorage.setItem("wasLoggedOut", "true");
    localStorage.removeItem("manualLogin");
    sessionStorage.removeItem("usuario");
    window.location.href = 'login.html';
  }
}

// Inicializar el gestor de sesión cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== DOM CONTENT LOADED ===');
  console.log('Pathname actual:', window.location.pathname);

  // Solo inicializar si no estamos en la página de login
  if (!window.location.pathname.includes('login.html')) {
    console.log('Inicializando SessionManager...');
    window.sessionManager = new SessionManager();

    // Intentos múltiples para asegurar que se ejecute la actualización de UI
    setTimeout(() => {
      console.log('=== FORZANDO actualización UI (500ms) ===');
      if (window.sessionManager && window.sessionManager.user) {
        window.sessionManager.toggleRoleBasedElements();
      }
    }, 500);

    setTimeout(() => {
      console.log('=== FORZANDO actualización UI (1000ms) ===');
      if (window.sessionManager && window.sessionManager.user) {
        window.sessionManager.toggleRoleBasedElements();
      }
    }, 1000);

    // Hacer disponibles funciones globalmente
    window.getCurrentUser = () => window.sessionManager.getCurrentUser();
    window.refreshUserData = () => window.sessionManager.refreshUserData();
    window.getCurrentRole = () => window.sessionManager.getCurrentRole();
    
  } else {
    console.log('En página de login, no inicializando SessionManager');
  }
  console.log('=== FIN DOM CONTENT LOADED ===');
});

// Funciones de utilidad globales
window.isLoggedIn = function() {
  return window.sessionManager ? window.sessionManager.isLoggedIn() : false;
};

window.getCurrentUserName = function() {
  const user = window.sessionManager ? window.sessionManager.getCurrentUser() : null;
  return user ? user.name : null;
};

window.isMaster = function() {
  return window.sessionManager ? window.sessionManager.isMaster() : false;
};

window.isAdmin = function() {
  return window.sessionManager ? window.sessionManager.isAdmin() : false;
};

// Función para hacer login (usar en el formulario de login)
window.doLogin = async function(email, password) {
  if (!window.sessionManager) {
    window.sessionManager = new SessionManager();
  }
  return await window.sessionManager.login(email, password);
};

// Funciones de debugging
window.debugUserInfo = function() {
  console.log('=== INFO DEL USUARIO ===');
  if (window.sessionManager && window.sessionManager.user) {
    console.log('Usuario:', window.sessionManager.user);
    console.log('Es Master:', window.sessionManager.isMaster());
    console.log('Es Admin:', window.sessionManager.isAdmin());
    console.log('Rol actual:', window.sessionManager.getCurrentRole());
  } else {
    console.log('No hay usuario logueado');
  }
  console.log('=== FIN INFO USUARIO ===');
};

window.forceUpdateUI = function() {
  console.log('=== FORZANDO ACTUALIZACIÓN UI ===');
  if (window.sessionManager) {
    window.sessionManager.updateUserInterface();
  }
};

// Exportar para uso en módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}