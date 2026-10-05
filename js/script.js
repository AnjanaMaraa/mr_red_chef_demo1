/* ==========================================================================
   MR RED CHEF — interaction layer
   Vanilla JavaScript, no dependencies.
   --------------------------------------------------------------------------
   CONFIG          — single place to change phone / brand / contact identity
   WhatsApp        — openWhatsApp(message) + pre-built per-button messages
   Header          — sticky state on scroll
   Mobile menu     — animated drawer with focus + ESC handling
   Scroll spy      — active navigation state
   Reveal          — IntersectionObserver fade-up
   Counters        — animated statistics
   Menu filter     — category chips
   Carousel        — testimonials with swipe, dots and autoplay
   Accordion       — FAQ
   Parallax        — subtle hero depth (disabled for reduced motion)
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG — edit these values to re-point the whole site
     ------------------------------------------------------------------ */
  var CONFIG = {
    brandName: 'MR RED CHEF',
    contactName: 'DigiMaraa Cafe',
    whatsappNumber: '917200251560',                 // country code + number, digits only
    phoneDisplay: '+91 72002 51560',
    phoneTel: '+917200251560',
    email: 'info@digimaraa.com'
  };

  var WHATSAPP_BASE = 'https://wa.me/' + CONFIG.whatsappNumber;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------ */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function on(el, type, handler, options) {
    if (el) el.addEventListener(type, handler, options);
  }

  /* ==================================================================
     WHATSAPP
     ================================================================== */

  /**
   * Encode a message and open WhatsApp in a new tab.
   * openWhatsApp("Hi DigiMaraa Cafe, I'd like to order a biryani.");
   */
  function openWhatsApp(message) {
    var text = message || 'Hi ' + CONFIG.contactName + ', I would like to place an order.';
    var url = WHATSAPP_BASE + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
    return url;
  }

  /* Message copy for each call-to-action context. */
  var MESSAGES = {
    'nav': function () {
      return 'Hi ' + CONFIG.contactName + ', I would like to place an order at ' + CONFIG.brandName + '.';
    },
    'mobile-nav': function () {
      return MESSAGES.nav();
    },
    'hero-primary': function () {
      return 'Hi ' + CONFIG.contactName + ', I would like to order food from ' + CONFIG.brandName + '.';
    },
    'about': function () {
      return MESSAGES['hero-primary']();
    },
    'why': function () {
      return 'Hi ' + CONFIG.contactName + ', I would like to enquire about dining at ' + CONFIG.brandName + '.';
    },
    'faq': function () {
      return 'Hi ' + CONFIG.contactName + ', I have a question about your menu.';
    },
    'cta': function () {
      return MESSAGES['hero-primary']();
    },
    'footer': function () {
      return MESSAGES['hero-primary']();
    },
    'footer-emails': function () {
      return 'Hi ' + CONFIG.contactName + ', I would like to know more about your menu.';
    },
    'order-bar': function () {
      return MESSAGES['hero-primary']();
    },
    'dish': function (name) {
      return "Hi " + CONFIG.contactName + ", I'm interested in " + (name || 'your menu') + '. Please share the details.';
    }
  };

  /**
   * Wire every [data-wa] link so it works with JS and still degrades
   * gracefully without it (href is written at runtime, JS-free fallback
   * is the bare wa.me link already present in the HTML).
   */
  function initWhatsApp() {
    var links = $$('[data-wa]');

    links.forEach(function (link) {
      var key = link.getAttribute('data-wa');
      var builder = MESSAGES[key];
      if (!builder) return;

      var message = link.hasAttribute('data-dish')
        ? builder(link.getAttribute('data-dish'))
        : builder();

      var url = WHATSAPP_BASE + '?text=' + encodeURIComponent(message);
      link.setAttribute('href', url);

      on(link, 'click', function (event) {
        event.preventDefault();
        openWhatsApp(message);
      });
    });
  }

  /* ==================================================================
     HEADER — transparent over hero, solid once scrolled
     ================================================================== */
  function initHeader() {
    var header = $('#siteHeader');
    if (!header) return;

    var ticking = false;

    function update() {
      var scrolled = window.scrollY > 24;
      header.classList.toggle('is-sticky', scrolled);
      ticking = false;
    }

    on(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ==================================================================
     MOBILE MENU
     ================================================================== */
  function initMobileMenu() {
    var toggle = $('#hamburger');
    var menu = $('#mobileMenu');
    if (!toggle || !menu) return;

    var panel = $('.mobile-menu__panel', menu);
    var lastFocused = null;

    function focusables() {
      return $$('a[href], button:not([disabled])', panel)
        .filter(function (el) { return el.offsetParent !== null; });
    }

    function open() {
      lastFocused = document.activeElement;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');

      var items = focusables();
      if (items.length) window.setTimeout(function () { items[0].focus(); }, 120);
    }

    function close(restoreFocus) {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      if (restoreFocus && lastFocused) lastFocused.focus();
    }

    on(toggle, 'click', function () {
      if (menu.classList.contains('is-open')) close(true);
      else open();
    });

    $$('[data-close-menu]', menu).forEach(function (el) {
      on(el, 'click', function () { close(true); });
    });

    // Close after choosing a destination (anchor scroll is handled by CSS).
    $$('.mobile-menu__link', menu).forEach(function (link) {
      on(link, 'click', function () { close(false); });
    });

    on(document, 'keydown', function (event) {
      if (!menu.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        close(true);
        return;
      }

      if (event.key === 'Tab') {
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    on(window, 'resize', function () {
      if (window.innerWidth > 820 && menu.classList.contains('is-open')) close(false);
    });
  }

  /* ==================================================================
     SCROLL SPY — highlight the current section
     ================================================================== */
  function initScrollSpy() {
    var sections = $$('main section[id]');
    var navLinks = $$('.nav__link');
    if (!sections.length || !navLinks.length) return;

    var ticking = false;

    function update() {
      /* Line just below the fixed header: the section occupying it is "current". */
      var line = (window.innerWidth <= 820 ? 70 : 86) + 28;
      var currentId = sections[0].id;

      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) currentId = section.id;
      });

      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + currentId;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      ticking = false;
    }

    on(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ==================================================================
     SCROLL REVEAL
     ================================================================== */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    items.forEach(function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ==================================================================
     STAT COUNTERS
     ================================================================== */
  function initCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) return;

    function format(value, decimals) {
      return value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

      if (reduceMotion || isNaN(target)) {
        el.textContent = format(isNaN(target) ? 0 : target, decimals);
        return;
      }

      var duration = 1600;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(target * eased, decimals);
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);

      /* Safety net: guarantee the final value even if rAF is throttled. */
      window.setTimeout(function () {
        el.textContent = format(target, decimals);
      }, duration + 250);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ==================================================================
     MENU FILTER
     ================================================================== */
  function initMenuFilter() {
    var chips = $$('.menu__filters .chip');
    var dishes = $$('.dish');
    if (!chips.length || !dishes.length) return;

    chips.forEach(function (chip) {
      on(chip, 'click', function () {
        var filter = chip.getAttribute('data-filter');

        chips.forEach(function (other) {
          var isActive = other === chip;
          other.classList.toggle('is-active', isActive);
          other.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        dishes.forEach(function (dish) {
          var matches = filter === 'all' || dish.getAttribute('data-category') === filter;
          dish.classList.toggle('is-hidden', !matches);
          if (matches) dish.classList.add('is-visible');
        });
      });
    });
  }

  /* ==================================================================
     TESTIMONIAL CAROUSEL
     ================================================================== */
  function initCarousel() {
    var carousel = $('#testimonialCarousel');
    var track = $('#carouselTrack');
    var dotsWrap = $('#carouselDots');
    if (!carousel || !track || !dotsWrap) return;

    var slides = $$('[data-carousel-slide]', track);
    if (slides.length < 2) return;

    var prevBtn = $('[data-carousel-prev]', carousel);
    var nextBtn = $('[data-carousel-next]', carousel);
    var viewport = $('.carousel__viewport', carousel);

    var index = 0;
    var autoplayTimer = null;
    var AUTOPLAY_MS = 6500;

    /* Build dots */
    var dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () {
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function setSlideState(i) {
      slides.forEach(function (slide, s) {
        var active = s === i;
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        $$('a[href], button', slide).forEach(function (el) {
          if (active) el.removeAttribute('tabindex');
          else el.setAttribute('tabindex', '-1');
        });
      });
      dots.forEach(function (dot, d) {
        var active = d === i;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
        dot.setAttribute('tabindex', active ? '0' : '-1');
      });
    }

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = 'translate3d(' + (-index * 100) + '%, 0, 0)';
      setSlideState(index);
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      autoplayTimer = window.setInterval(next, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    on(prevBtn, 'click', function () { prev(); restartAutoplay(); });
    on(nextBtn, 'click', function () { next(); restartAutoplay(); });

    on(carousel, 'mouseenter', stopAutoplay);
    on(carousel, 'mouseleave', startAutoplay);
    on(carousel, 'focusin', stopAutoplay);
    on(carousel, 'focusout', function (event) {
      if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });

    on(carousel, 'keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); restartAutoplay(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); restartAutoplay(); }
    });

    /* Touch / pointer swipe */
    var startX = 0;
    var startY = 0;
    var deltaX = 0;
    var deltaY = 0;
    var pointerId = null;
    var dragging = false;

    on(viewport, 'pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      deltaY = 0;
      carousel.classList.add('is-dragging');
      stopAutoplay();

      /* Capture keeps the gesture tracking if the finger slides off the card. */
      if (viewport.setPointerCapture) {
        try { viewport.setPointerCapture(pointerId); } catch (err) { /* no-op */ }
      }
    });

    on(viewport, 'pointermove', function (event) {
      if (!dragging || event.pointerId !== pointerId) return;
      deltaX = event.clientX - startX;
      deltaY = event.clientY - startY;
      if (Math.abs(deltaX) < 4) return;
      track.style.transform =
        'translate3d(calc(' + (-index * 100) + '% + ' + deltaX + 'px), 0, 0)';
    });

    function endDrag(event) {
      if (!dragging || (event && event.pointerId !== pointerId)) return;
      dragging = false;
      carousel.classList.remove('is-dragging');

      /* Only treat it as a swipe when the gesture was mostly horizontal. */
      var threshold = Math.min(viewport.offsetWidth * 0.2, 90);
      var isSwipe = Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY);

      if (isSwipe) {
        if (deltaX < 0) next();
        else prev();
      } else {
        goTo(index);
      }

      deltaX = 0;
      deltaY = 0;
      startAutoplay();
    }

    on(viewport, 'pointerup', endDrag);
    on(viewport, 'pointercancel', endDrag);
    on(viewport, 'lostpointercapture', endDrag);

    /* Dot keyboard navigation — also moves focus to the newly active dot.
       The dots sit inside the carousel, so propagation must be stopped or the
       carousel-level arrow handler would advance a second time. */
    on(dotsWrap, 'keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      event.stopPropagation();
      var nextIndex = event.key === 'ArrowRight'
        ? (index + 1) % slides.length
        : (index - 1 + slides.length) % slides.length;
      goTo(nextIndex);
      dots[nextIndex].focus();
      restartAutoplay();
    });

    goTo(0);
    startAutoplay();
  }

  /* ==================================================================
     FAQ ACCORDION
     ================================================================== */
  function initAccordion() {
    var accordion = $('#faqAccordion');
    if (!accordion) return;

    var triggers = $$('.accordion__trigger', accordion);
    var panels = $$('.accordion__panel', accordion);

    /* Remove the no-JS `hidden` attribute so CSS can animate the panel. */
    panels.forEach(function (panel) {
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'true');
    });

    function close(panel) {
      var trigger = $('[aria-controls="' + panel.id + '"]', accordion);
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }

    function open(panel) {
      var trigger = $('[aria-controls="' + panel.id + '"]', accordion);
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    triggers.forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      on(trigger, 'click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';

        /* One panel at a time */
        panels.forEach(function (other) {
          if (other !== panel && other.classList.contains('is-open')) close(other);
        });

        if (isOpen) close(panel);
        else open(panel);
      });
    });

    /* Open the first item by default so the section never looks empty. */
    if (panels[0]) open(panels[0]);
  }

  /* ==================================================================
     HERO PARALLAX (subtle, scroll-linked depth)
     ================================================================== */
  function initParallax() {
    var root = $('[data-parallax-root]');
    if (!root || reduceMotion) return;

    var layers = $$('[data-parallax]', root);
    if (!layers.length) return;

    var ticking = false;
    var visible = true;

    function update() {
      if (!visible) return;

      var rect = root.getBoundingClientRect();
      var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

      layers.forEach(function (layer) {
        var strength = parseFloat(layer.getAttribute('data-parallax')) || 0;
        var offset = (progress - 0.5) * strength * -220;
        layer.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px, 0)';
      });

      ticking = false;
    }

    on(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    on(document, 'visibilitychange', function () {
      visible = !document.hidden;
    });

    update();
  }

  /* ==================================================================
     STICKY MOBILE ORDER BAR
     ================================================================== */
  function initOrderBar() {
    var bar = $('#orderBar');
    if (!bar) return;

    var ticking = false;

    function update() {
      var show = window.scrollY > Math.min(560, window.innerHeight * 0.7);
      bar.classList.toggle('is-visible', show);
      ticking = false;
    }

    on(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ==================================================================
     FOOTER YEAR
     ================================================================== */
  function initYear() {
    var slots = $$('[data-year]');
    slots.forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ==================================================================
     BOOT
     ================================================================== */
  function init() {
    initWhatsApp();
    initHeader();
    initMobileMenu();
    initScrollSpy();
    initReveal();
    initCounters();
    initMenuFilter();
    initCarousel();
    initAccordion();
    initParallax();
    initOrderBar();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Public API — handy for quick edits and console use */
  window.MRC = {
    config: CONFIG,
    openWhatsApp: openWhatsApp,
    whatsappUrl: function (message) {
      var text = message || MESSAGES['hero-primary']();
      return WHATSAPP_BASE + '?text=' + encodeURIComponent(text);
    }
  };
})();