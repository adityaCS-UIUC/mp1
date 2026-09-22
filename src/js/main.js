document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const menuToggle = document.querySelector(".navbar__menu-toggle");
  const menu = document.querySelector(".navbar__menu");
  const navLinks = Array.from(
    document.querySelectorAll('.navbar__link[href^="#"]')
  );
  const internalLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const sectionEntries = navLinks
    .map((link) => {
      const targetId = link.getAttribute("href");
      const section = targetId ? document.querySelector(targetId) : null;

      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const closeNavigationMenu = () => {
    if (!menuToggle || !menu) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };

  const setActiveNavLink = (activeLink) => {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle("active", isActive);
      link.toggleAttribute("data-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateNavigationState = () => {
    if (navbar) {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }

    if (sectionEntries.length === 0) {
      return;
    }

    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const viewportBottom = window.scrollY + window.innerHeight;
    const finalSectionBounds =
      sectionEntries[sectionEntries.length - 1].section.getBoundingClientRect();
    const isAtPageBottom =
      viewportBottom >= documentHeight - 4 ||
      finalSectionBounds.bottom <= window.innerHeight + 4;

    if (isAtPageBottom) {
      setActiveNavLink(sectionEntries[sectionEntries.length - 1].link);
      return;
    }

    const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;
    const activationLine = navbarHeight + 8;
    let activeEntry = sectionEntries[0];

    sectionEntries.forEach((entry) => {
      if (entry.section.getBoundingClientRect().top <= activationLine) {
        activeEntry = entry;
      }
    });

    setActiveNavLink(activeEntry.link);
  };

  let scrollFrame = null;
  let scrollSettleTimer = null;

  window.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(updateNavigationState, 120);

      if (scrollFrame !== null) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        updateNavigationState();
        scrollFrame = null;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", updateNavigationState);
  window.addEventListener("load", updateNavigationState);
  updateNavigationState();

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(willOpen));
      menu.classList.toggle("is-open", willOpen);
    });

    document.addEventListener("click", (event) => {
      if (
        menu.classList.contains("is-open") &&
        !menu.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeNavigationMenu();
      }
    });
  }

  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      closeNavigationMenu();
      const matchingNavLink = navLinks.find(
        (navLink) => navLink.getAttribute("href") === targetId
      );

      if (matchingNavLink) {
        setActiveNavLink(matchingNavLink);
      }

      const scrollOffset =
        Number.parseFloat(
          window.getComputedStyle(document.documentElement).scrollPaddingTop
        ) || 0;
      const targetPosition =
        window.scrollY + target.getBoundingClientRect().top - scrollOffset;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });

      if (window.location.hash !== targetId) {
        window.history.pushState(null, "", targetId);
      }
    });
  });

  const carousel = document.querySelector(".carousel");

  if (carousel) {
    const track = carousel.querySelector(".carousel__track");
    const slides = Array.from(carousel.querySelectorAll(".carousel__slide"));
    const previousButton = carousel.querySelector(".carousel-prev");
    const nextButton = carousel.querySelector(".carousel-next");
    const dots = Array.from(carousel.querySelectorAll(".carousel__dot"));
    const initiallyActiveIndex = slides.findIndex((slide) =>
      slide.classList.contains("active")
    );
    let currentIndex = initiallyActiveIndex >= 0 ? initiallyActiveIndex : 0;

    const renderCarousel = () => {
      if (!track || slides.length === 0) {
        return;
      }

      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, index) => {
        const isActive = index === currentIndex;
        slide.classList.toggle("active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      dots.forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle("active", isActive);

        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const goToSlide = (index) => {
      if (slides.length === 0) {
        return;
      }

      currentIndex = (index + slides.length) % slides.length;
      renderCarousel();
    };

    if (previousButton) {
      previousButton.addEventListener("click", () =>
        goToSlide(currentIndex - 1)
      );
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => goToSlide(currentIndex + 1));
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        const requestedIndex = Number.parseInt(dot.dataset.slideTo, 10);
        goToSlide(Number.isNaN(requestedIndex) ? index : requestedIndex);
      });
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(currentIndex + 1);
      }
    });

    renderCarousel();
  }

  const modalTriggers = Array.from(
    document.querySelectorAll(".modal-trigger[data-modal-target]")
  );
  const modals = Array.from(document.querySelectorAll(".modal"));
  let activeModal = null;
  let previouslyFocusedElement = null;

  const getFocusableElements = (modal) =>
    Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute("hidden"));

  const closeModal = (modal = activeModal) => {
    if (!modal) {
      return;
    }

    modal.classList.remove("is-active");
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");

    const modalVideo = modal.querySelector("[data-modal-video]");

    if (modalVideo) {
      modalVideo.pause();
    }

    if (modal === activeModal) {
      activeModal = null;
      document.body.classList.remove("modal-open");

      if (
        previouslyFocusedElement &&
        document.contains(previouslyFocusedElement)
      ) {
        previouslyFocusedElement.focus();
      }

      previouslyFocusedElement = null;
    }
  };

  const openModal = (modal) => {
    if (!modal) {
      return;
    }

    if (activeModal && activeModal !== modal) {
      closeModal(activeModal);
    }

    previouslyFocusedElement = document.activeElement;
    activeModal = modal;
    modal.classList.remove("is-hidden");
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const modalVideo = modal.querySelector("[data-modal-video]");

    if (modalVideo) {
      modalVideo.play().catch(() => {
        // The visible video controls remain available if autoplay is blocked.
      });
    }

    const focusableElements = getFocusableElements(modal);
    const preferredFocus =
      modal.querySelector(".modal__close, .modal-close") ||
      focusableElements[0];

    if (preferredFocus) {
      window.requestAnimationFrame(() => preferredFocus.focus());
    }
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modalId = trigger.dataset.modalTarget;
      const modal = modalId ? document.getElementById(modalId) : null;
      openModal(modal);
    });
  });

  modals.forEach((modal) => {
    modal
      .querySelectorAll(
        "[data-modal-close], .modal-close, .modal-overlay, .modal__backdrop"
      )
      .forEach((closeControl) => {
        closeControl.addEventListener("click", () => closeModal(modal));
      });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (activeModal) {
        closeModal(activeModal);
      } else {
        closeNavigationMenu();
      }

      return;
    }

    if (event.key !== "Tab" || !activeModal) {
      return;
    }

    const focusableElements = getFocusableElements(activeModal);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
});