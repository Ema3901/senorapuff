class SessionManager {
  constructor() {
    this.user = null;
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

  // Cargar usuario desde sessionStorage
  loadUserFromSession() {
    const userData = sessionStorage.getItem("usuario");
    if (userData) {
      try {
        this.user = JSON.parse(userData);
        console.log("Usuario cargado desde sesión:", this.user);
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
    if (this.user && (!this.user.id_user || !this.user.name)) {
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

    // Mostrar/Ocultar los enlaces solo para id_rol = 4
    console.log('Llamando a toggleAdminLinks...');
    this.toggleAdminLinks();

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
    userBox.insertBefore(initialsElement, userName);
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
      const response = await fetch(`https://inventariolabsapi.uttn.app/api/users/${this.user.id_user}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json();

      // Actualizar los datos en memoria y en sessionStorage
      this.user = updatedUser;
      sessionStorage.setItem("usuario", JSON.stringify(updatedUser));

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

  // Verificar si es administrador
  isAdmin() {
    console.log('=== isAdmin Debug ===');
    const result = this.hasRole(4); // Rol 4 es admin
    console.log('Resultado isAdmin:', result);
    console.log('=== Fin isAdmin Debug ===');
    return result;
  }

  // Mostrar/Ocultar links solo para id_rol = 4 - VERSIÓN CORREGIDA
  toggleAdminLinks() {
    console.log('=== INICIO toggleAdminLinks ===');

    // Verificar datos del usuario
    console.log('Usuario completo:', this.user);
    console.log('RoleInfo:', this.user?.RoleInfo);
    console.log('id_rol:', this.user?.RoleInfo?.id_rol);

    // Verificar función isAdmin
    const isRole4 = this.isAdmin();
    console.log('Resultado isAdmin():', isRole4);

    // Buscar elementos admin
    const adminLinks = document.querySelectorAll('.admin-link');
    console.log('Elementos encontrados con .admin-link:', adminLinks.length);

    adminLinks.forEach((el, index) => {
      console.log(`--- Procesando elemento ${index} ---`);
      console.log('Contenido:', el.textContent.trim());

      if (isRole4) {
        console.log('Usuario ES admin, mostrando enlace');

        // MÉTODO 1: Usar display directo con !important
        el.style.setProperty('display', 'list-item', 'important');

        // MÉTODO 2: Agregar clase (como backup)
        el.classList.add('show');

        // MÉTODO 3: Remover el estilo que lo oculta
        el.classList.remove('admin-link-hidden');

        el.setAttribute('aria-hidden', 'false');

        console.log('Enlace mostrado - Display:', window.getComputedStyle(el).display);
        console.log('Clases:', el.className);

      } else {
        console.log('Usuario NO es admin, ocultando enlace');
        el.style.setProperty('display', 'none', 'important');
        el.classList.remove('show');
        el.classList.add('admin-link-hidden');
        el.setAttribute('aria-hidden', 'true');
      }

      console.log(`--- Fin elemento ${index} ---`);
    });

    // Add/remove 'user-admin' class to the body based on admin status
    if (isRole4) {
      document.body.classList.add('user-admin');
      console.log('Agregada clase user-admin al body.');
    } else {
      document.body.classList.remove('user-admin');
      console.log('Removida clase user-admin del body.');
    }


    console.log('=== FIN toggleAdminLinks ===');
  }
}

// Función global para cerrar sesión (compatible con tu código actual)
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

    // MÚLTIPLES INTENTOS para asegurar que se ejecute
    setTimeout(() => {
      console.log('=== FORZANDO toggleAdminLinks (500ms) ===');
      if (window.sessionManager) {
        window.sessionManager.toggleAdminLinks();
      }
    }, 500);

    setTimeout(() => {
      console.log('=== FORZANDO toggleAdminLinks (1000ms) ===');
      if (window.sessionManager) {
        window.sessionManager.toggleAdminLinks();
      }
    }, 1000);

    setTimeout(() => {
      console.log('=== FORZANDO toggleAdminLinks (2000ms) ===');
      if (window.sessionManager) {
        window.sessionManager.toggleAdminLinks();
      }
    }, 2000);

    // Hacer disponible globalmente para debugging
    window.getCurrentUser = () => window.sessionManager.getCurrentUser();
    window.refreshUserData = () => window.sessionManager.refreshUserData();

    // Función de debug manual
    window.debugAdmin = () => {
      console.log('=== DEBUG MANUAL ===');
      if (window.sessionManager) {
        window.sessionManager.toggleAdminLinks();
      }
    };
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

// Función para mostrar enlaces admin manualmente (para debugging)
window.forceShowAdminLinks = function() {
  console.log('=== FORZANDO MOSTRAR ENLACES ADMIN ===');
  const adminLinks = document.querySelectorAll('.admin-link');
  adminLinks.forEach(el => {
    el.style.setProperty('display', 'list-item', 'important');
    el.classList.add('show');
    console.log('Enlace forzado a mostrar:', el.textContent.trim());
  });
};

// Función para debugging - mostrar información del usuario
window.debugUserInfo = function() {
  console.log('=== INFO DEL USUARIO ===');
  if (window.sessionManager && window.sessionManager.user) {
    console.log('Usuario:', window.sessionManager.user);
    console.log('Es Admin:', window.sessionManager.isAdmin());
    console.log('ID Rol:', window.sessionManager.user.RoleInfo?.id_rol);
    console.log('Rol:', window.sessionManager.user.RoleInfo?.rol);
  } else {
    console.log('No hay usuario logueado');
  }
  console.log('=== FIN INFO USUARIO ===');
};

// Exportar para uso en módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}