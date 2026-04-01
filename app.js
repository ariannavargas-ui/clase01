const API_BASE = 'http://127.0.0.1:8000';

const state = {
  loggedInEmail: null,
};

const tabs = Array.from(document.querySelectorAll('#sidebar-nav a'));
const sections = Array.from(document.querySelectorAll('main section'));
const footerBadge = document.querySelector('#sidebar-footer .user-badge');
const logoutButton = document.getElementById('logout-button');

const protectedTabNames = ['servicios', 'mascotas', 'reporte'];

function showAlert(target, type, message) {
  const container = target instanceof HTMLFormElement || target instanceof HTMLElement ? target : document.body;
  const alert = document.createElement('div');
  alert.className = `alert ${type === 'error' ? 'alert-error' : 'alert-success'}`;
  alert.textContent = message;
  container.prepend(alert);
  setTimeout(() => {
    alert.remove();
  }, 3200);
}

function updateSidebarForAuth() {
  tabs.forEach((tab) => {
    const isProtected = protectedTabNames.includes(tab.dataset.tab);
    if (isProtected) {
      if (state.loggedInEmail) {
        tab.classList.remove('locked');
      } else {
        tab.classList.add('locked');
      }
    }
  });

  if (state.loggedInEmail) {
    footerBadge.innerHTML = `Usuario: <strong>${state.loggedInEmail}</strong>`;
    logoutButton.style.display = 'block';
  } else {
    footerBadge.innerHTML = 'Usuario: <strong>Invitado</strong>';
    logoutButton.style.display = 'none';
  }
}

function setActiveTab(tabName) {
  sections.forEach((section) => section.classList.remove('active'));
  tabs.forEach((tab) => tab.classList.remove('active'));

  const targetTab = tabs.find((tab) => tab.dataset.tab === tabName);
  const targetSection = document.getElementById(tabName);

  if (!targetTab || !targetSection) {
    return;
  }

  if (protectedTabNames.includes(tabName) && !state.loggedInEmail) {
    showAlert(document.getElementById('acceso'), 'error', 'Necesitas iniciar sesión para acceder a esta sección.');
    setActiveTab('acceso');
    return;
  }

  targetTab.classList.add('active');
  targetSection.classList.add('active');

  if (tabName === 'reporte' && state.loggedInEmail) {
    const reporteEmail = document.getElementById('reporte-email');
    if (reporteEmail) reporteEmail.value = state.loggedInEmail;
  }

  if (tabName === 'servicios') {
    loadServicios();
  }

  if (tabName === 'mascotas' && state.loggedInEmail) {
    loadMascotas(state.loggedInEmail);
  }
}

function switchTab(name) {
  setActiveTab(name);
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.mensaje || data.detail || `Error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

async function loadServicios() {
  try {
    const data = await apiGet('/servicios');
    const servicios = Array.isArray(data.servicios) ? data.servicios : [];

    const lista = document.querySelector('#lista-servicios ul');
    if (lista) {
      lista.innerHTML = '';
      if (servicios.length === 0) {
        lista.innerHTML = '<li>No hay servicios aún.</li>';
      } else {
        servicios.forEach((service) => {
          const li = document.createElement('li');
          li.textContent = `${service.nombre} - $${Number(service.precio).toFixed(2)}`;
          lista.appendChild(li);
        });
      }
    }

    const select = document.getElementById('mascota-servicio');
    if (select) {
      const selected = select.value;
      select.innerHTML = '<option value="">Selecciona un servicio</option>';
      servicios.forEach((service) => {
        const option = document.createElement('option');
        option.value = service.nombre;
        option.textContent = `${service.nombre} - $${Number(service.precio).toFixed(2)}`;
        select.appendChild(option);
      });
      select.value = selected;
    }
  } catch (err) {
    showAlert(document.getElementById('servicios'), 'error', `No se pudieron cargar servicios: ${err.message}`);
  }
}

function renderMascotas(mascotas = []) {
  const cont = document.querySelector('#resultados-mascotas ul');
  if (!cont) return;
  cont.innerHTML = '';

  if (!mascotas.length) {
    cont.innerHTML = '<li>No se encontraron mascotas.</li>';
    return;
  }

  mascotas.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <h4>${m.nombre || 'Sin nombre'}</h4>
      <p><strong>Dueño:</strong> ${m.correo || 'N/A'}</p>
      <p><strong>Servicio:</strong> ${m.tipo_servicio || 'N/A'}</p>
      <p><strong>Fecha:</strong> ${m.fecha || 'N/A'}</p>
    `;
    cont.appendChild(li);
  });
}

async function loadMascotas(correo) {
  if (!correo) return;
  try {
    const data = await apiGet(`/mascotas/${encodeURIComponent(correo)}`);
    const mascotas = Array.isArray(data.mascotas) ? data.mascotas : [];
    renderMascotas(mascotas);
  } catch (err) {
    showAlert(document.getElementById('mascotas'), 'error', `No se pudo obtener mascotas: ${err.message}`);
  }
}

function renderReporte(reporte) {
  const area = document.querySelector('#area-resultados-reporte div');
  if (!area) return;

  area.innerHTML = '';
  const cantidad = Number(reporte.cantidad_servicios || 0);
  const total = Number(reporte.total_gastado || 0);
  const correo = reporte.correo || '';
  const servicios = Array.isArray(reporte.servicios) ? reporte.servicios : [];

  const stats = document.createElement('div');
  stats.className = 'card';
  stats.innerHTML = `
    <div><strong>Cantidad servicios:</strong> ${cantidad}</div>
    <div><strong>Total gastado:</strong> $${total.toFixed(2)}</div>
    <div><strong>Correo:</strong> ${correo}</div>
  `;
  area.appendChild(stats);

  const tags = document.createElement('div');
  tags.style.marginTop = '0.8rem';
  tags.innerHTML = '<strong>Servicios usados:</strong>';
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexWrap = 'wrap';
  wrap.style.gap = '0.4rem';

  if (servicios.length === 0) {
    const none = document.createElement('span');
    none.textContent = 'Sin servicios registrados';
    wrap.appendChild(none);
  } else {
    servicios.forEach((serv) => {
      const pill = document.createElement('span');
      pill.textContent = serv;
      pill.style.background = 'rgba(14, 165, 160, 0.15)';
      pill.style.color = '#065f46';
      pill.style.borderRadius = '999px';
      pill.style.padding = '0.25rem 0.55rem';
      pill.style.fontSize = '0.84rem';
      wrap.appendChild(pill);
    });
  }

  area.appendChild(tags);
  area.appendChild(wrap);
}

async function init() {
  updateSidebarForAuth();

  tabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  logoutButton.addEventListener('click', () => {
    state.loggedInEmail = null;
    updateSidebarForAuth();
    setActiveTab('acceso');
    showAlert(document.getElementById('acceso'), 'success', 'Has cerrado sesión correctamente.');
  });

  const formSaludo = document.getElementById('form-saludo');
  formSaludo?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-saludo').value.trim();
    if (!nombre) {
      showAlert(formSaludo, 'error', 'Por favor ingresa tu nombre.');
      return;
    }

    try {
      const data = await apiGet(`/bienvenido/${encodeURIComponent(nombre)}`);
      const mensaje = data?.mensaje || `Bienvenido, ${nombre}!`;
      showAlert(formSaludo, 'success', mensaje);
      formSaludo.reset();
    } catch (err) {
      console.error('Error en saludo:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        showAlert(formSaludo, 'success', `Bienvenido, ${nombre}! (modo offline)`);
      } else {
        showAlert(formSaludo, 'error', `Error: ${err.message}`);
      }
    }
  });

  const formRegistro = document.getElementById('form-registro');
  formRegistro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('registro-email').value.trim();
    const contrasena = document.getElementById('registro-password').value.trim();
    if (!correo || !contrasena) {
      showAlert(formRegistro, 'error', 'Completa ambos campos de registro.');
      return;
    }

    try {
      const data = await apiPost('/register', { correo, contrasena });
      showAlert(formRegistro, 'success', data.mensaje || 'Registro exitoso.');
      formRegistro.reset();
    } catch (err) {
      showAlert(formRegistro, 'error', `Registro fallido: ${err.message}`);
    }
  });

  const formLogin = document.getElementById('form-login');
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('login-email').value.trim();
    const contrasena = document.getElementById('login-password').value.trim();
    if (!correo || !contrasena) {
      showAlert(formLogin, 'error', 'Completa ambos campos de acceso.');
      return;
    }

    try {
      const data = await apiPost('/login', { correo, contrasena });
      state.loggedInEmail = correo;
      updateSidebarForAuth();
      showAlert(formLogin, 'success', data.mensaje || 'Inicio de sesión correcto.');
      formLogin.reset();
      setActiveTab('servicios');
    } catch (err) {
      showAlert(formLogin, 'error', `Login fallido: ${err.message}`);
    }
  });

  const formAgregarServicio = document.getElementById('form-agregar-servicio');
  formAgregarServicio?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('servicio-nombre').value.trim();
    const precio = document.getElementById('servicio-precio').value;
    if (!nombre || !precio) {
      showAlert(formAgregarServicio, 'error', 'Completa nombre y precio.');
      return;
    }

    try {
      const data = await apiPost('/agregar-servicio', { nombre, precio: Number(precio) });
      showAlert(formAgregarServicio, 'success', data.mensaje || 'Servicio agregado correctamente.');
      formAgregarServicio.reset();
      loadServicios();
    } catch (err) {
      showAlert(formAgregarServicio, 'error', `No se pudo agregar servicio: ${err.message}`);
    }
  });

  const formRegistrarMascota = document.getElementById('form-registrar-mascota');
  formRegistrarMascota?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('mascota-email').value.trim();
    const nombre = document.getElementById('mascota-nombre').value.trim();
    const tipo_servicio = document.getElementById('mascota-servicio').value;
    const fecha = document.getElementById('mascota-fecha').value;

    if (!correo || !nombre || !tipo_servicio || !fecha) {
      showAlert(formRegistrarMascota, 'error', 'Completa todos los campos de mascota.');
      return;
    }

    try {
      const data = await apiPost('/registrar-mascota', { correo, nombre, tipo_servicio, fecha });
      showAlert(formRegistrarMascota, 'success', data.mensaje || 'Mascota registrada.');
      formRegistrarMascota.reset();
      if (state.loggedInEmail && state.loggedInEmail === correo) {
        loadMascotas(correo);
      }
    } catch (err) {
      showAlert(formRegistrarMascota, 'error', `Error al registrar mascota: ${err.message}`);
    }
  });

  const formBuscarMascota = document.getElementById('form-buscar-mascota');
  formBuscarMascota?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const busqueda = document.getElementById('buscar-mascota').value.trim();
    const correo = busqueda || state.loggedInEmail;

    if (!correo) {
      showAlert(formBuscarMascota, 'error', 'Ingresa el correo del dueño para buscar.');
      return;
    }

    try {
      await loadMascotas(correo);
      showAlert(formBuscarMascota, 'success', 'Búsqueda realizada.');
    } catch (err) {
      showAlert(formBuscarMascota, 'error', `No se encontró mascota: ${err.message}`);
    }
  });

  const formReporte = document.getElementById('form-reporte');
  formReporte?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('reporte-email').value.trim();

    if (!correo) {
      showAlert(formReporte, 'error', 'Ingresa un correo para el reporte.');
      return;
    }

    try {
      const data = await apiGet(`/reporte/${encodeURIComponent(correo)}`);
      renderReporte(data);
      showAlert(formReporte, 'success', 'Reporte cargado correctamente.');
    } catch (err) {
      showAlert(formReporte, 'error', `Error al cargar reporte: ${err.message}`);
    }
  });

  // Cargar servicios iniciales
  loadServicios();

  // Poner el tab inicial
  setActiveTab('inicio');
}

init();
