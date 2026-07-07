// 1. Immediate scroll reset to prevent jumps on load
window.scrollTo(0, 0);
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (window.location.hash) {
  history.replaceState("", document.title, window.location.pathname + window.location.search);
}

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

  // Hide preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
    }, 400);
  }

  // Parallax Scroll Effect
  const headerSection = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    let scrollVal = window.scrollY;
    if (headerSection) {
      headerSection.style.setProperty('--parallax-offset', `${scrollVal * 0.35}px`);
    }
  });

  // Scroll Reveal Observer
  const scrollElements = document.querySelectorAll('.scroll-reveal');
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  scrollElements.forEach(el => scrollObserver.observe(el));

  // Accordion Panel Logic
  const collapsibles = document.querySelectorAll('.section-wrapper');
  collapsibles.forEach(section => {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    if (!btn || !content) return;

    content.style.maxHeight = '0px';
    content.style.opacity = '0';
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', () => {
      const isOpen = section.classList.contains('open');
      if (isOpen) {
        closePanel(section);
      } else {
        openPanel(section);
      }
    });
  });

  function openPanel(section) {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    const sectionId = section.getAttribute('id');
    
    section.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    content.style.opacity = '1';
    content.style.maxHeight = content.scrollHeight + 'px';

    content.addEventListener('transitionend', function handler() {
      if (section.classList.contains('open')) {
        content.style.maxHeight = 'none';
        content.style.overflow = 'visible';
        
        window.dispatchEvent(new Event('resize')); 
        
        if (sectionId === 'ads-section') {
          initRadarChart();
          animateReportProgressBars('Mes 1');
        } else if (sectionId === 'financial-section') {
          initProjectionChart();
        }
      }
      content.removeEventListener('transitionend', handler);
    }, { once: true });

    const staggerItems = content.querySelectorAll('.stagger-item');
    staggerItems.forEach((item, index) => {
      setTimeout(() => {
        if (section.classList.contains('open')) {
          item.classList.add('active');
        }
      }, index * 80 + 100);
    });
  }

  function closePanel(section) {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    const sectionId = section.getAttribute('id');
    
    content.style.overflow = 'hidden';
    content.style.maxHeight = content.scrollHeight + 'px';
    content.offsetHeight; // Force reflow

    section.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    content.style.maxHeight = '0px';
    content.style.opacity = '0';

    const staggerItems = content.querySelectorAll('.stagger-item');
    staggerItems.forEach(item => {
      item.classList.remove('active');
    });

    if (sectionId === 'ads-section') {
      destroyRadarChart();
      resetReportProgressBars();
    } else if (sectionId === 'financial-section') {
      destroyProjectionChart();
    }
  }

  // Chatbot Simulator
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatCredits = document.getElementById('chatCredits');
  const chatWindow = document.getElementById('chatWindow');
  
  let questionCount = 0;
  const maxQuestions = 3;

  const responses = [
    "**[Asistente Legal mariló]:** Con respecto a su duda civil sobre arrendamiento en el Estado de Morelos, el Código Civil local establece en su artículo 1860 que el arrendador está obligado a entregar la finca en buen estado. ¿Tiene alguna duda específica sobre el contrato de arrendamiento o las reparaciones?",
    "**[Asistente Legal mariló]:** Sobre su duda laboral de despido injustificado, la Ley Federal del Trabajo en su artículo 48 le otorga el derecho a reclamar la indemnización constitucional (3 meses de salario) o la reinstalación. ¿Desea saber cómo se calcula el finiquito o prefiere analizar las causales de rescisión?",
    "**[Asistente Legal mariló]:** Analizando su tercera consulta legal sobre la validez de contratos mercantiles... [Procesando jurisprudencia aplicable en CDMX y Morelos]"
  ];

  if (chatInput && chatSendBtn && chatMessages) {
    chatSendBtn.addEventListener('click', sendUserMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendUserMessage();
    });
  }

  function sendUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-msg');
    chatInput.value = '';
    questionCount++;
    
    chatCredits.textContent = maxQuestions - questionCount;
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    setTimeout(() => {
      if (questionCount === 1) {
        appendMessage(responses[0], 'bot-msg');
      } else if (questionCount === 2) {
        appendMessage(responses[1], 'bot-msg');
      } else if (questionCount === 3) {
        appendMessage(responses[2], 'bot-msg');
        setTimeout(triggerCreditsExhausted, 1500);
        return;
      }
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    }, 1200);
  }

  function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-bubble ${className} anim-popup`;
    msgDiv.innerHTML = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function triggerCreditsExhausted() {
    const overlay = document.createElement('div');
    overlay.className = 'chat-exhausted-overlay anim-popup';
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(35, 31, 32, 0.95); color: #ffffff;
      display: flex; flex-direction: column; justify-content: center;
      align-items: center; padding: var(--space-md); text-align: center; z-index: 100;
      border-radius: var(--radius-sm);
    `;

    overlay.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 10px;">⚠️</div>
      <h4 style="color: var(--color-lime); margin-bottom: 10px; font-family: var(--font-display); font-size: 1.3rem;">Créditos Gratuitos Agotados</h4>
      <p style="font-size: 0.9rem; color: #d1d5db; max-width: 320px; margin-bottom: 20px; line-height: 1.4;">
        Has alcanzado el límite de 3 consultas jurídicas gratuitas de cortesía. Para continuar, el sistema deriva automáticamente a la contratación del paquete legal.
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px;">
        <a href="#store-section" class="cta-button" style="padding: 10px; font-size: 0.8rem; border: none; text-align: center; width: 100%; background: var(--color-lime); color: var(--color-charcoal);" onclick="document.querySelector('#store-section').scrollIntoView({behavior: 'smooth'});">
          Ver Paquetes de Consulta
        </a>
        <button id="resetChatBtn" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #ffffff; padding: 8px; border-radius: var(--radius-sm); font-size: 0.8rem; cursor: pointer;">
          Reiniciar Simulación
        </button>
      </div>
    `;

    chatWindow.appendChild(overlay);
    
    document.getElementById('resetChatBtn').addEventListener('click', () => {
      overlay.remove();
      questionCount = 0;
      chatCredits.textContent = maxQuestions;
      chatMessages.innerHTML = `
        <div class="chat-bubble bot-msg">
          <strong>[Asistente Legal mariló]:</strong> Bienvenido al portal de asesoría legal automatizada. He sido programado bajo la jurisprudencia del Estado de Morelos y la CDMX.
        </div>
        <div class="chat-bubble bot-msg">
          Tienes hasta <strong>3 consultas libres</strong> antes de pasar a la derivación de pago. ¿En qué duda legal puedo ayudarte hoy?
        </div>
      `;
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    });
  }

  // Social Report Simulator (CVR focus instead of Costs)
  const reportMonthBtn1 = document.getElementById('reportMonthBtn1');
  const reportMonthBtn2 = document.getElementById('reportMonthBtn2');
  
  if (reportMonthBtn1 && reportMonthBtn2) {
    reportMonthBtn1.addEventListener('click', () => {
      updateReportSimulator('Mes 1');
      reportMonthBtn1.classList.add('active');
      reportMonthBtn2.classList.remove('active');
    });

    reportMonthBtn2.addEventListener('click', () => {
      updateReportSimulator('Mes 2');
      reportMonthBtn2.classList.add('active');
      reportMonthBtn1.classList.remove('active');
    });
  }

  function updateReportSimulator(month) {
    const isM2 = month === 'Mes 2';
    
    document.getElementById('repImpressions').textContent = isM2 ? '48,500' : '22,400';
    document.getElementById('repImpressionsDelta').textContent = isM2 ? '+116%' : '+0%';
    
    document.getElementById('repCpl').textContent = isM2 ? '2.8%' : '1.2%';
    document.getElementById('repCplDelta').className = isM2 ? 'delta up' : 'delta';
    document.getElementById('repCplDelta').textContent = isM2 ? '+133%' : '0%';
    
    document.getElementById('repLeads').textContent = isM2 ? '38' : '12';
    document.getElementById('repLeadsDelta').textContent = isM2 ? '+216%' : '+0%';

    document.getElementById('repGoogleConvs').textContent = isM2 ? '15' : '6';
    document.getElementById('repGoogleCpl').textContent = isM2 ? '3.8%' : '2.5%';
    
    document.getElementById('repMetaConvs').textContent = isM2 ? '18' : '5';
    document.getElementById('repMetaCpl').textContent = isM2 ? '3.4%' : '1.8%';

    document.getElementById('repTikTokConvs').textContent = isM2 ? '5' : '1';
    document.getElementById('repTikTokCpl').textContent = isM2 ? '1.5%' : '0.8%';

    animateReportProgressBars(month);
  }

  function animateReportProgressBars(month) {
    const isM2 = month === 'Mes 2';
    
    const barLabor = document.getElementById('barLabor');
    const barLaborVal = document.getElementById('barLaborVal');
    const barCivil = document.getElementById('barCivil');
    const barCivilVal = document.getElementById('barCivilVal');
    const barFamiliar = document.getElementById('barFamiliar');
    const barFamiliarVal = document.getElementById('barFamiliarVal');

    if (barLabor && barCivil && barFamiliar) {
      barLabor.style.width = '0%';
      barCivil.style.width = '0%';
      barFamiliar.style.width = '0%';
      
      setTimeout(() => {
        barLabor.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        barCivil.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        barFamiliar.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';

        barLabor.style.width = isM2 ? '45%' : '30%';
        barLaborVal.textContent = isM2 ? '17' : '4';
        
        barCivil.style.width = isM2 ? '30%' : '40%';
        barCivilVal.textContent = isM2 ? '11' : '5';

        barFamiliar.style.width = isM2 ? '25%' : '30%';
        barFamiliarVal.textContent = isM2 ? '10' : '3';
      }, 50);
    }
  }

  function resetReportProgressBars() {
    const barLabor = document.getElementById('barLabor');
    const barCivil = document.getElementById('barCivil');
    const barFamiliar = document.getElementById('barFamiliar');
    if (barLabor && barCivil && barFamiliar) {
      barLabor.style.transition = 'none';
      barCivil.style.transition = 'none';
      barFamiliar.style.transition = 'none';
      barLabor.style.width = '0%';
      barCivil.style.width = '0%';
      barFamiliar.style.width = '0%';
    }
  }

  // Chart.js Configuration
  let projectionChartInstance = null;
  let radarChartInstance = null;

  Chart.defaults.color = '#4b5563'; 
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  // 1. Radar Chart (Marketing Channels)
  function initRadarChart() {
    destroyRadarChart();
    const ctx = document.getElementById('channelsChart')?.getContext('2d');
    if (!ctx) return;

    radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Credibilidad', 'Volumen de Leads', 'Costo de Adquisición', 'Interacción', 'Segmentación Legal'],
        datasets: [
          {
            label: 'Google Ads (Búsqueda)',
            data: [95, 90, 75, 40, 95], 
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2
          },
          {
            label: 'Meta Ads (FB/IG)',
            data: [80, 95, 85, 80, 85], 
            borderColor: '#b5dc17', 
            backgroundColor: 'rgba(181, 220, 23, 0.1)',
            borderWidth: 2
          },
          {
            label: 'LinkedIn (Profesional)',
            data: [95, 50, 40, 60, 90], 
            borderColor: '#231f20', 
            backgroundColor: 'rgba(35, 31, 32, 0.1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        animation: { duration: 2000, easing: 'easeOutQuart' },
        scales: {
          r: {
            angleLines: { color: 'rgba(35, 31, 32, 0.08)' },
            grid: { color: 'rgba(35, 31, 32, 0.08)' },
            pointLabels: { color: '#231f20', font: { size: 11, weight: 'bold' } },
            ticks: { backdropColor: 'transparent', color: '#4b5563', showLabelBackdrop: false },
            suggestedMin: 20,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#231f20', padding: 10 } }
        }
      }
    });
  }

  function destroyRadarChart() {
    if (radarChartInstance) {
      radarChartInstance.destroy();
      radarChartInstance = null;
    }
  }

  // 2. Linear Projection Chart (Cumulative Case Volume)
  function initProjectionChart() {
    destroyProjectionChart();
    const ctx = document.getElementById('projectionChart')?.getContext('2d');
    if (!ctx) return;

    const labels = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'];
    const volumes = [10, 18, 28, 42, 58, 75, 90, 105, 120, 135, 145, 155];
    
    // Compute cumulative sum of case volume
    let cumulativeVolume = [];
    let currentSum = 0;
    for (let i = 0; i < volumes.length; i++) {
      currentSum += volumes[i];
      cumulativeVolume.push(currentSum);
    }

    projectionChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Volumen Mensual de Consultas (Casos Nuevos)',
            data: volumes,
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Volumen Acumulado de Consultas',
            data: cumulativeVolume,
            borderColor: '#b5dc17', 
            backgroundColor: 'rgba(181, 220, 23, 0.08)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: [3, 3, 7, 3, 3, 3, 3, 3, 3, 3, 3, 3],
            pointBackgroundColor: '#231f20',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        animation: { duration: 2500, easing: 'easeOutQuart' },
        scales: {
          y: {
            grid: { color: 'rgba(35, 31, 32, 0.05)' },
            ticks: {
              callback: function(value) {
                return value + ' consultas';
              }
            }
          },
          x: { grid: { color: 'rgba(35, 31, 32, 0.05)' } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: '#231f20' } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.raw} consultas`;
              }
            }
          }
        }
      }
    });
  }

  function destroyProjectionChart() {
    if (projectionChartInstance) {
      projectionChartInstance.destroy();
      projectionChartInstance = null;
    }
  }
});
