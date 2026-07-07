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
  // Accordion / Collapsible Panel Logic
  // ==========================================
  const collapsibles = document.querySelectorAll('.section-wrapper');

  collapsibles.forEach(section => {
    const btn = section.querySelector('.collapsible-header');
    const content = section.querySelector('.collapsible-content');
    if (!btn || !content) return;

    // Set initial state
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
            btn.style.borderColor = 'var(--color-gold)';
            btn.style.color = 'var(--color-gold)';
          }, 2000);
        })
        .catch(err => {
          console.error('Error al copiar el enlace:', err);
        });
    });
  });

  // ==========================================
  // Chart.js - Data Visualizations
  // ==========================================

  Chart.defaults.color = '#94a3b8'; // text-muted
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  // 1. Budget Allocation Chart (Pie Chart) - Updated
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
            'rgba(197, 160, 89, 0.85)', // Gold
            'rgba(59, 130, 246, 0.75)',  // Blue
            'rgba(139, 92, 246, 0.75)'   // Violet
          ],
          borderColor: '#111827',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              color: '#f8fafc'
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

  // 2. Financial Projection (Line Chart) - Updated
  const ctxProjection = document.getElementById('projectionChart')?.getContext('2d');
  if (ctxProjection) {
    const labels = ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'];
    
    // Average Package Price: $500 MXN.
    // Adjusted volume representing steady growth:
    const volumes = [10, 18, 28, 42, 58, 75, 90, 105, 120, 135, 145, 155];
    
    // Setup Investment: $38,000 (Branding $12k + Setup $8k + Web $18k)
    // Monthly Operating Cost: Ads ($3,000) + Content ($8,000) + Google/SiteGround/HubSpot ($1,200) = $12,200
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
            borderColor: '#10b981', // Green
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Inversión Total Acumulada',
            data: cumulativeInvestment,
            borderColor: '#ef4444', // Red
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.1,
            borderWidth: 2
          },
          {
            label: 'Flujo Neto Acumulado (ROI)',
            data: cumulativeNet,
            borderColor: '#c5a059', // Gold
            backgroundColor: 'rgba(197, 160, 89, 0.1)',
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
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString() + ' MXN';
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#f8fafc'
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

  // 3. Channel Performance Analysis (Radar Chart)
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
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2
          },
          {
            label: 'Meta Ads (FB/IG)',
            data: [80, 95, 85, 80, 85], 
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2
          },
          {
            label: 'LinkedIn (Profesional)',
            data: [95, 50, 40, 60, 90], 
            borderColor: '#c5a059',
            backgroundColor: 'rgba(197, 160, 89, 0.2)',
            borderWidth: 2
          }
        ]
      },
      options: {
        scales: {
          r: {
            angleLines: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            pointLabels: {
              color: '#f8fafc',
              font: {
                size: 11
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: '#94a3b8',
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
              color: '#f8fafc',
              padding: 10
            }
          }
        }
      }
    });
  }
});
