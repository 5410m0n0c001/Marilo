/**
 * Premium Portfolio Showcase Component Script
 * Features:
 * - Constant pixels-per-second scrolling speed
 * - requestAnimationFrame for smooth 60 FPS scrolling
 * - Lazy-loading and preloading (only 2 images in DOM at a time)
 * - Apple-inspired 3D cylinder rotating transition
 * - Hover / Touch pause behavior
 * - Dynamic metadata synchronization with soft fade animations
 */

(function () {
  // 1. Projects Data Structure
  const PROJECTS = [
    {
      id: "01",
      title: "Identidad Gráfica & Branding Legal",
      desc: "Desarrollo completo de la identidad visual de la marca. Incluye la selección cromática de alta gama, el isotipo corporativo, retículas de papelería e informes legales diseñados para proyectar rigor técnico y excelencia.",
      tags: ["Marca Personal", "Dirección de Arte", "Logotipo", "Editorial"],
      image: "assets/images/identidad grafica.png"
    },
    {
      id: "02",
      title: "Ecosistema Digital Centralizado",
      desc: "Interfaz del sitio web principal optimizado para conversión. Presenta una arquitectura de la información impecable, una tipografía de gran legibilidad y botones de llamada a la acción integrados con HubSpot CRM.",
      tags: ["Diseño Web", "WordPress", "UX/UI", "HubSpot"],
      image: "assets/images/3096949b-3bbb-4399-9024-0cec2ac380ff.png"
    },
    {
      id: "03",
      title: "Plataforma de Consultoría Jurídica",
      desc: "Sitio web interactivo enfocado en la contratación de servicios legales en línea. Integra un embudo optimizado y un sistema de agendas automatizado para una experiencia de usuario sumamente fluida.",
      tags: ["WordPress", "Divi", "eCommerce", "Pasarela de Pagos"],
      image: "assets/images/a28a990a-18ba-437f-981d-1087a5de8498.png"
    },
    {
      id: "04",
      title: "Portal de Asesorías Automatizadas",
      desc: "Maquetación del catálogo de asesorías legales por materias. Permite a los clientes corporativos seleccionar y reservar paquetes específicos con facturación automatizada.",
      tags: ["Catálogo Digital", "Divi Builder", "Automatización", "Fintech"],
      image: "assets/images/82bd38aa-dd1c-4476-9d32-3aa8ced084c8.png"
    },
    {
      id: "05",
      title: "Embudo de Conversión de Tráfico",
      desc: "Página de aterrizaje optimizada para campañas de tráfico pagado (Meta & Google Ads). Estructura persuasiva que recopila datos de clientes potenciales directamente hacia el CRM.",
      tags: ["Landing Page", "Lead Gen", "n8n Integration", "Ads Optimization"],
      image: "assets/images/48b887dc-1874-4b9d-9bab-3c748739b2c8.png"
    },
    {
      id: "06",
      title: "Notion & Asana Workspace",
      desc: "Área de cliente centralizada y panel de control interno del proyecto. Permite un seguimiento del estado de los registros de marcas y las asesorías legales en tiempo real.",
      tags: ["Workspace Design", "Gestión de Proyectos", "API Integrations", "CRM"],
      image: "assets/images/4fb5effe-c12b-402e-ac01-b370faa9af6c.png"
    },
    {
      id: "07",
      title: "Estudio y Sondeo de Mercado",
      desc: "Visualización digital del reporte interactivo de viabilidad de marcas y análisis competitivo. Diseñado bajo rigurosas retículas editoriales con diagramación de datos premium.",
      tags: ["Análisis de Datos", "Diseño Editorial", "WordPress Custom Page", "PDF Reports"],
      image: "assets/images/55680def-d305-4a89-8bce-a351dcb7c3ac.png"
    }
  ];

  // 2. Constants and State Variables
  const SCROLL_SPEED = 55; // Pixels per second
  const PAUSE_AT_BOTTOM = 1200; // milliseconds
  const TRANSITION_DURATION = 1800; // milliseconds

  let activeIndex = 0;
  let isPaused = false;
  let isTransitioning = false;

  let currentY = 0;
  let maxScrollY = 0;
  let lastTime = 0;

  // DOM references
  let viewport, activeContainer, incomingContainer, activeImg, incomingImg;
  let metaCounter, projectTitle, projectDesc, tagsContainer, indicators;

  // 3. Initialize Component
  function init() {
    viewport = document.getElementById("showcase-viewport");
    if (!viewport) return;

    // Create container elements dynamically for preloading / double buffering
    activeContainer = document.createElement("div");
    activeContainer.className = "screenshot-container active";
    activeImg = document.createElement("img");
    activeImg.className = "screenshot-img";
    activeContainer.appendChild(activeImg);
    viewport.appendChild(activeContainer);

    incomingContainer = document.createElement("div");
    incomingContainer.className = "screenshot-container incoming";
    incomingImg = document.createElement("img");
    incomingImg.className = "screenshot-img";
    incomingContainer.appendChild(incomingImg);
    viewport.appendChild(incomingContainer);

    // Get metadata DOM elements
    metaCounter = document.getElementById("portfolio-counter");
    projectTitle = document.getElementById("portfolio-title");
    projectDesc = document.getElementById("portfolio-desc");
    tagsContainer = document.getElementById("portfolio-tags-list");
    indicators = document.querySelectorAll(".portfolio-indicator-item");

    // Load first project
    loadProject(activeIndex, true);

    // Setup Event Listeners for Hover and Touch control
    const frame = document.getElementById("device-frame");
    if (frame) {
      // Desktop Hover Pause
      frame.addEventListener("mouseenter", () => { isPaused = true; });
      frame.addEventListener("mouseleave", () => { isPaused = false; });
      
      // Mobile Touch Pause
      frame.addEventListener("touchstart", () => { isPaused = true; }, { passive: true });
      frame.addEventListener("touchend", () => { isPaused = false; }, { passive: true });
      frame.addEventListener("touchcancel", () => { isPaused = false; }, { passive: true });
    }

    // Setup indicator clicks
    if (indicators) {
      indicators.forEach((item, index) => {
        item.addEventListener("click", () => {
          if (isTransitioning || activeIndex === index) return;
          triggerTransitionTo(index);
        });
      });
    }

    // Start requestAnimationFrame Loop
    requestAnimationFrame(updateLoop);
  }

  // 4. Load Project Data
  function loadProject(index, isFirstLoad = false) {
    const project = PROJECTS[index];
    
    // Set active index state
    activeIndex = index;

    // Active project setup
    activeImg.src = project.image;
    currentY = 0;
    activeImg.style.transform = `translateY(0)`;
    
    // Ensure image load measures height correctly
    activeImg.onload = function() {
      calculateHeights();
    };
    // Fallback if cached
    if (activeImg.complete) {
      calculateHeights();
    }

    // Update texts and indicators immediately on first load, or with smooth fades
    updateMetadataUI(project, isFirstLoad);
    updateIndicatorsUI(index);

    // Preload next image in queue
    preloadNextImage();
  }

  // 5. Heights Calculation
  function calculateHeights() {
    if (!activeImg || !viewport) return;
    const imgHeight = activeImg.getBoundingClientRect().height;
    const viewHeight = viewport.getBoundingClientRect().height;
    maxScrollY = Math.max(0, imgHeight - viewHeight);
  }

  // 6. Preload Next Image
  function preloadNextImage() {
    const nextIndex = (activeIndex + 1) % PROJECTS.length;
    incomingImg.src = PROJECTS[nextIndex].image;
  }

  // 7. Update Loop (Animation Loop)
  function updateLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;

    if (!isPaused && !isTransitioning && maxScrollY > 0) {
      // Scroll image up
      currentY += SCROLL_SPEED * delta;
      
      if (currentY >= maxScrollY) {
        currentY = maxScrollY;
        activeImg.style.transform = `translateY(-${currentY}px)`;
        
        // Update indicator fill to 100%
        updateProgressFill(100);

        // Pause at bottom, then transition
        isTransitioning = true;
        setTimeout(() => {
          triggerTransitionTo((activeIndex + 1) % PROJECTS.length);
        }, PAUSE_AT_BOTTOM);
      } else {
        activeImg.style.transform = `translateY(-${currentY}px)`;
        
        // Calculate progress percentage
        const progress = (currentY / maxScrollY) * 100;
        updateProgressFill(progress);
      }
    }

    requestAnimationFrame(updateLoop);
  }

  // 8. Progress Fill Animation
  function updateProgressFill(percentage) {
    const activeIndicator = document.querySelector(`.portfolio-indicator-item[data-index="${activeIndex}"] .indicator-line-fill`);
    if (activeIndicator) {
      activeIndicator.style.width = `${percentage}%`;
    }
  }

  // 9. Reset Progress Fills
  function resetProgressFills() {
    const fills = document.querySelectorAll(".indicator-line-fill");
    fills.forEach(fill => {
      fill.style.width = "0%";
    });
  }

  // 10. Metadata UI Updates with dynamic fades
  function updateMetadataUI(project, immediate = false) {
    if (immediate) {
      if (metaCounter) metaCounter.textContent = `${project.id} / ${PROJECTS.length.toString().padStart(2, '0')}`;
      if (projectTitle) projectTitle.textContent = project.title;
      if (projectDesc) projectDesc.textContent = project.desc;
      updateTagsUI(project.tags);
      return;
    }

    // Apply fade-out classes
    const fadeElements = [projectTitle, projectDesc, tagsContainer];
    fadeElements.forEach(el => {
      if (el) {
        el.classList.add("fade-out-down");
        el.classList.remove("fade-in-up");
      }
    });

    setTimeout(() => {
      // Swap content
      if (metaCounter) metaCounter.textContent = `${project.id} / ${PROJECTS.length.toString().padStart(2, '0')}`;
      if (projectTitle) projectTitle.textContent = project.title;
      if (projectDesc) projectDesc.textContent = project.desc;
      updateTagsUI(project.tags);

      // Trigger fade-in
      fadeElements.forEach(el => {
        if (el) {
          el.classList.remove("fade-out-down");
          el.classList.add("fade-in-up");
        }
      });
    }, 400);
  }

  // 11. Tags UI rendering
  function updateTagsUI(tags) {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = "";
    tags.forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "portfolio-tag";
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
  }

  // 12. Indicators class update
  function updateIndicatorsUI(index) {
    if (!indicators) return;
    indicators.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  // 13. Cylinder 3D Transition Trigger
  function triggerTransitionTo(nextIndex) {
    isTransitioning = true;
    isPaused = true;
    
    // Ensure the incoming image is set to the correct one (handles manual navigation)
    incomingImg.src = PROJECTS[nextIndex].image;
    incomingImg.style.transform = "translateY(0)"; // Start incoming image scroll at 0

    // Force reflow/repaint to apply transition correctly
    incomingContainer.getBoundingClientRect();

    // Reset progress indicator bars
    resetProgressFills();

    // Trigger CSS 3D Slot Machine Transition
    activeContainer.classList.remove("active");
    activeContainer.classList.add("outgoing");

    incomingContainer.classList.remove("incoming");
    incomingContainer.classList.add("active");

    // Fade out metadata and animate text transitions
    updateMetadataUI(PROJECTS[nextIndex], false);
    updateIndicatorsUI(nextIndex);

    // Wait for transition duration
    setTimeout(() => {
      // Transition completed, swap active and incoming containers in state
      const tempContainer = activeContainer;
      const tempImg = activeImg;

      activeContainer = incomingContainer;
      activeImg = incomingImg;

      incomingContainer = tempContainer;
      incomingImg = tempImg;

      // Reset the new incoming container classes
      incomingContainer.className = "screenshot-container incoming";
      incomingImg.style.transform = "translateY(0)";

      activeIndex = nextIndex;
      calculateHeights();

      // Reset state for new scroll
      currentY = 0;
      isTransitioning = false;
      isPaused = false;
    }, TRANSITION_DURATION);
  }

  // 14. Handle window resize to recalculate viewport and image dimensions
  window.addEventListener("resize", () => {
    calculateHeights();
  });

  // Run on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
