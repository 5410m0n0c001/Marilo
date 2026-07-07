document.addEventListener('DOMContentLoaded', () => {
  // Hide preloader once page is loaded
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
    }, 400);
  }

  // ==========================================
  // Scroll Reveal Observer (AOS style)
  // ==========================================
  const scrollElements = document.querySelectorAll('.scroll-reveal');
  
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        scrollObserver.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before entering viewport
  });

  scrollElements.forEach(el => scrollObserver.observe(el));

  // ==========================================
  // Accordion / Collapsible Panel Logic
  // ==========================================
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

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  function openPanel(section) {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    section.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    
    content.style.opacity = '1';
    content.style.maxHeight = content.scrollHeight + 'px';

    content.addEventListener('transitionend', function handler() {
      if (section.classList.contains('open')) {
        content.style.maxHeight = 'none';
        content.style.overflow = 'visible';
      }
      content.removeEventListener('transitionend', handler);
    }, { once: true });

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  function closePanel(section) {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    
    content.style.overflow = 'hidden';
    content.style.maxHeight = content.scrollHeight + 'px';
    content.offsetHeight; // Force reflow

    section.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
  }

  if (window.location.hash) {
    const targetSection = document.querySelector(window.location.hash);
    if (targetSection && targetSection.classList.contains('section-wrapper')) {
      setTimeout(() => {
        openPanel(targetSection);
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }

  // ==========================================
  // Share Section Functionality
  // ==========================================
  const shareButtons = document.querySelectorAll('.share-section-btn');
  shareButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sectionId = btn.getAttribute('data-section');
      const shareTitle = btn.getAttribute('data-title') || 'Propuesta Mariló';
      const shareUrl = `${window.location.origin}${window.location.pathname}#${sectionId}`;

      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = '✔ ¡Enlace copiado!';
          btn.style.borderColor = 'var(--color-success)';
          btn.style.color = 'var(--color-success)';
          
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.borderColor = 'var(--color-charcoal)';
            btn.style.color = 'var(--color-charcoal)';
          }, 2000);
        })
        .catch(err => {
          console.error('Error al copiar el enlace:', err);
        });
    });
  });

  // ==========================================
  // Interactive Chatbot Simulator
  // ==========================================
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
    chatSendBtn.addEventListener('click', () => {
      sendUserMessage();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendUserMessage();
      }
    });
  }

  function sendUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage(text, 'user-msg');
    chatInput.value = '';
    questionCount++;
    
    // Update credit counter
    const remaining = maxQuestions - questionCount;
    chatCredits.textContent = remaining;

    // Disable input while generating response
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    // Simulate bot thinking
    setTimeout(() => {
      if (questionCount === 1) {
        appendMessage(responses[0], 'bot-msg');
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
      } else if (questionCount === 2) {
        appendMessage(responses[1], 'bot-msg');
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
      } else if (questionCount === 3) {
        appendMessage(responses[2], 'bot-msg');
        
        // Show credits exhausted pop-up redirect after a short delay
        setTimeout(() => {
          triggerCreditsExhausted();
        }, 1500);
      }
    }, 1200);
  }

  function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-bubble ${className} anim-popup`;
    
    // Handle basic markdown bold for simulated bot titles
    const formattedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = formattedText;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function triggerCreditsExhausted() {
    // Replace chat area or display overlay
    const overlay = document.createElement('div');
    overlay.className = 'chat-exhausted-overlay anim-popup';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(35, 31, 32, 0.95);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: var(--space-md);
      text-align: center;
      z-index: 100;
      border-radius: var(--radius-sm);
    `;

    overlay.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 10px;">⚠️</div>
      <h4 style="color: var(--color-lime); margin-bottom: 10px; font-family: var(--font-display); font-size: 1.3rem;">Créditos Gratuitos Agotados</h4>
      <p style="font-size: 0.9rem; color: #d1d5db; max-width: 320px; margin-bottom: 20px; line-height: 1.4;">
        Has alcanzado el límite de 3 consultas jurídicas gratuitas de cortesía. Para continuar recibiendo asesoría de la abogada mariló, elige una opción:
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px;">
        <a href="#store-section" class="cta-button" style="padding: 10px; font-size: 0.8rem; border: none; text-align: center; width: 100%; background: var(--color-lime); color: var(--color-charcoal);" onclick="document.querySelector('#store-section').scrollIntoView({behavior: 'smooth'});">
          Contratar Consulta ($400 MXN)
        </a>
        <button id="resetChatBtn" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #ffffff; padding: 8px; border-radius: var(--radius-sm); font-size: 0.8rem; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='#ffffff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.3)'">
          Reiniciar Simulación
        </button>
      </div>
    `;

    chatWindow.appendChild(overlay);
    
    // Add event to restart simulation
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

  // ==========================================
  // Chart.js - Data Visualizations (HLC Style)
  // ==========================================

  Chart.defaults.color = '#4b5563'; 
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  const ctxBudget = document.getElementById('budgetChart')?.getContext('2d');
  if (ctxBudget) {
    new Chart(ctxBudget, {
      type: 'doughnut',
      data: {
        labels: [
          'Branding Personal (Fase 1)',
          'Setup Ecosistema, Google & HubSpot (Fase 2)',
          'Desarrollo Web WordPress Divi & Bot n8n (Fase 3)'
        ],
        datasets: [{
          data: [12000, 8000, 18000],
          backgroundColor: [
            'rgba(181, 220, 23, 0.85)',  
            'rgba(35, 31, 32, 0.8)',     
            'rgba(59, 130, 246, 0.75)'   
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              color: '#231f20'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let value = context.raw;
                return ` ${context.label}: $${value.toLocaleString()} MXN`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  const ctxProjection = document.getElementById('projectionChart')?.getContext('2d');
  if (ctxProjection) {
    const labels = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'];
    const volumes = [10, 18, 28, 42, 58, 75, 90, 105, 120, 135, 145, 155];
    const initialInvestment = 38000;
    const monthlyCost = 12200;
    const avgPrice = 500;

    let cumulativeInvestment = [initialInvestment + monthlyCost];
    let monthlyIncome = [];
    let cumulativeIncome = [volumes[0] * avgPrice];
    let cumulativeNet = [cumulativeIncome[0] - cumulativeInvestment[0]];

    for (let i = 1; i < 12; i++) {
      cumulativeInvestment.push(cumulativeInvestment[i - 1] + monthlyCost);
      let income = volumes[i] * avgPrice;
      monthlyIncome.push(income);
      cumulativeIncome.push(cumulativeIncome[i - 1] + income);
      cumulativeNet.push(cumulativeIncome[i] - cumulativeInvestment[i]);
    }

    new Chart(ctxProjection, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingreso Acumulado',
            data: cumulativeIncome,
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Inversión Total Acumulada',
            data: cumulativeInvestment,
            borderColor: '#231f20', 
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.1,
            borderWidth: 2
          },
          {
            label: 'Flujo Neto Acumulado (ROI)',
            data: cumulativeNet,
            borderColor: '#b5dc17', 
            backgroundColor: 'rgba(181, 220, 23, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3
          }
        ]
      },
      options: {
        scales: {
          y: {
            grid: {
              color: 'rgba(35, 31, 32, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString() + ' MXN';
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(35, 31, 32, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#231f20'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let value = context.raw;
                return ` ${context.dataset.label}: $${value.toLocaleString()} MXN`;
              }
            }
          }
        }
      }
    });
  }

  const ctxChannels = document.getElementById('channelsChart')?.getContext('2d');
  if (ctxChannels) {
    new Chart(ctxChannels, {
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
        scales: {
          r: {
            angleLines: {
              color: 'rgba(35, 31, 32, 0.08)'
            },
            grid: {
              color: 'rgba(35, 31, 32, 0.08)'
            },
            pointLabels: {
              color: '#231f20',
              font: {
                size: 11,
                weight: 'bold'
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: '#4b5563',
              showLabelBackdrop: false
            },
            suggestedMin: 20,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#231f20',
              padding: 10
            }
          }
        }
      }
    });
  }
});
