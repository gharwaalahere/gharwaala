
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client
// We use Vite's import.meta.env to access environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Initialize Lenis Smooth Scroll ---
  let lenis;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // --- Splash Screen Cleanup ---
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.remove();
    }
  }, 2800);


  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuBtn && navLinks) {
    // Toggle menu
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking any link inside it
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });

    // Close menu on scroll
    window.addEventListener('scroll', () => {
      navLinks.classList.remove('active');
    }, { passive: true });
  }

  // --- Lead Form Modal Logic ---
  const modal = document.getElementById('leadModal');
  const triggerBtns = document.querySelectorAll('.cta-trigger');
  const closeBtn = document.getElementById('closeModal');

  // --- Timeline Dynamic Scroll Animation Logic ---
  const timelineContainer = document.querySelector('.how-it-works-visible-timeline');
  const scrollLine = document.querySelector('.how-it-works-visible-line');
  const timelineSteps = document.querySelectorAll('.how-it-works-visible-row');

  if (timelineContainer && scrollLine) {
    let ticking = false;

    const updateTimeline = () => {
      // Calculate continuous scroll progress mapped to the container height
      const containerRect = timelineContainer.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.85; // triggering point - reveal earlier

      const progressPixels = Math.max(0, viewportCenter - containerRect.top);
      let percentage = (progressPixels / containerRect.height) * 100;
      percentage = Math.min(100, Math.max(0, percentage)); // clamp between 0-100

      scrollLine.style.height = `${percentage}%`;

      // Activate step cards exactly when the scroll line hits them
      timelineSteps.forEach(step => {
        const stepRect = step.getBoundingClientRect();
        if (stepRect.top < viewportCenter) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTimeline);
        ticking = true;
      }
    }, { passive: true });

    // Initialize state instantly on load
    window.requestAnimationFrame(updateTimeline);
  }

  // Open Modal
  if (triggerBtns.length > 0 && modal) {
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
      });
    });
  }

  // Explore Designs button → smooth scroll to kitchen styles section
  const exploreBtn = document.getElementById('exploreDesignsBtn');
  const designsSection = document.getElementById('designs');
  if (exploreBtn && designsSection) {
    exploreBtn.addEventListener('click', () => {
      designsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Success Popup Close globally accessible
  window.closeSuccessPopup = function () {
    const popup = document.getElementById('successPopup');
    if (popup) {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }
    const leadModal = document.getElementById('leadModal');
    if (leadModal) {
      leadModal.classList.remove('active');
    }
  };

  // Close Modal
  const closeModal = () => {
    modal.classList.remove('active');
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeModal);

    // Close when clicking outside of modal content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 2. Form Submission Logic
  const leadForm = document.getElementById('leadForm');
  const formMsg = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  const citySelect = document.getElementById('city');
  const localityGroup = document.getElementById('localityGroup');
  const localityInput = document.getElementById('locality');
  const waitlistNote = document.getElementById('waitlistNote');
  
  // Multi-step logic
  const step1 = document.getElementById('formStep1');
  const step2 = document.getElementById('formStep2');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const prevStepBtn = document.getElementById('prevStepBtn');

  if (nextStepBtn && step1 && step2) {
    nextStepBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('name');
      const phoneInput = document.getElementById('phone');
      
      // Validate Step 1 (Name & Phone)
      if (nameInput && !nameInput.reportValidity()) return;
      if (phoneInput && !phoneInput.reportValidity()) return;

      step1.style.display = 'none';
      step2.style.display = 'block';
    });
  }

  if (prevStepBtn && step1 && step2) {
    prevStepBtn.addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = 'block';
    });
  }

  if (citySelect && localityGroup && submitBtn) {
    citySelect.addEventListener('change', (e) => {
      if (e.target.value === 'Other') {
        localityGroup.style.display = 'none';
        localityInput.required = false;
        submitBtn.textContent = 'Join Waitlist';
        if (waitlistNote) waitlistNote.style.display = 'block';
      } else {
        localityGroup.style.display = 'block';
        localityInput.required = true;
        submitBtn.textContent = 'Submit Request';
        if (waitlistNote) waitlistNote.style.display = 'none';
      }
    });
  }

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset messages
      formMsg.className = 'form-message';
      formMsg.textContent = '';

      if (!supabase) {
        formMsg.textContent = "Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file.";
        formMsg.classList.add('error');
        return;
      }

      // Get Data
      const formData = new FormData(leadForm);
      const name = formData.get('name');
      let phone = formData.get('phone') || '';
      const city = formData.get('city');
      const locality = formData.get('locality') || '';

      // Indian Phone Validation
      const cleanPhone = phone.replace(/\D/g, ''); // strip spaces, +, -
      let finalPhone = cleanPhone;

      if (finalPhone.length === 12 && finalPhone.startsWith('91')) {
        finalPhone = finalPhone.substring(2);
      } else if (finalPhone.length === 11 && finalPhone.startsWith('0')) {
        finalPhone = finalPhone.substring(1);
      }

      // Strict Anti-Spam Validation
      const isIndianMobile = /^[6-9]\d{9}$/.test(finalPhone);
      const isRepeated = /^(.)\1{9}$/.test(finalPhone); // Blocks 9999999999, 8888888888
      const isSequential = finalPhone === '9876543210' || finalPhone === '8765432109';

      if (!isIndianMobile || isRepeated || isSequential) {
        formMsg.textContent = "Please enter a genuine, active 10-digit mobile number.";
        formMsg.classList.add('error');
        return; // halt submission if spam/fake
      }
      phone = finalPhone; // use clean 10-digit number for db/email

      // Reconstruct full location string for db compatibility
      let location = formData.get('location');
      if (!location) {
        location = city === 'Other' ? 'Other City' : `${locality}, ${city}`;
      }
      const budget = formData.get('budget');

      // UI Feedback: Loading
      const originalBtnContent = submitBtn.innerHTML;
      submitBtn.innerHTML = `<svg class="spinner" viewBox="0 0 50 50" style="width:20px;height:20px;margin-right:8px;vertical-align:middle;animation:spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle></svg> Submitting...`;
      submitBtn.disabled = true;

      try {
        // 1. Instant Email Notification via Web3Forms
        const web3FormsKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
        if (web3FormsKey && web3FormsKey.trim() !== '') {
          // Format explicitly to Indian Standard Time to prevent UTC timezone drift
          const submissionTime = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short"
          });

          const payloadObject = {
            access_key: web3FormsKey,
            subject: "🔔 NEW LEAD: " + name + " from " + location,
            from_name: "Gharwaala System",
            email: "notifications@gharwaala.com", // Critical: Bypasses silent spam drops by satisfying standard email format requirements
            Name: name,
            Phone: phone,
            Location: location,
            Budget: budget,
            "System Check": "Passed - Authentic Lead",
            "Submitted At (IST)": submissionTime
          };

          try {
            const w3Res = await fetch("https://api.web3forms.com/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify(payloadObject)
            });
            const w3Json = await w3Res.json();
            if (!w3Json.success) {
              console.error("Web3Forms API rejected:", w3Json);
              // Silently fail: do not alert the user. Supabase is the source of truth.
            } else {
              console.log("Web3Forms Email Sent Successfully!", w3Json);
            }
          } catch (err) {
            console.error("Web3Forms Network Error:", err);
            // Silently fail network errors to ensure user still sees Success Popup for Supabase.
          }
        }

        // 2. Insert into Supabase table "leads"
        if (supabase) {
          const { data, error } = await supabase
            .from('leads')
            .insert([
              { name, phone, location, budget }
            ]);

          if (error) {
            console.error("Supabase Error:", error);
          }
        }

        // Success
        const popup = document.getElementById('successPopup');
        if (popup) {
          popup.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else {
          formMsg.textContent = "Thank you! Our team will contact you shortly.";
          formMsg.classList.add('success');
        }
        leadForm.reset();
        
        // Reset multi-step on success
        if (step1 && step2) {
          step2.style.display = 'none';
          step1.style.display = 'block';
        }

      } catch (err) {
        console.error("Supabase Error:", err);
        formMsg.textContent = "Failed to submit request. Please try again.";
        formMsg.classList.add('error');
      } finally {
        // Revert UI
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;

        // Auto close modal on success after 3 seconds
        if (formMsg.classList.contains('success')) {
          setTimeout(() => {
            closeModal();
            formMsg.className = 'form-message'; // reset
            formMsg.textContent = '';
          }, 3000);
        }
      }
    });
  }
});

// ==========================================
// Global Photo Gallery Modal Logic
// ==========================================
const galleryData = {
  modular: [
    { url: "/modular_corner.webp", title: "Smart Corner Storage", desc: "Magic corner units making use of blind spots." },
    { url: "/modular_tandem.webp", title: "Tandem Drawers", desc: "Heavy-duty tandem boxes for large utensils." },
    { url: "/modular_overhead.webp", title: "Overhead Cabinets", desc: "Hydraulic lift-ups for easy overhead access." },
    { url: "/modular_pantry.webp", title: "Tall Pantry", desc: "Pull-out pantry units for massive grocery storage." },
    { url: "/modular_wicker.webp", title: "Wicker Baskets", desc: "Integrated woven wicker baskets for dry vegetables." },
    { url: "/modular_sink.webp", title: "Under-Sink Utility", desc: "Detergent racks and bin holders under the sink." },
    { url: "/modular_shutter.webp", title: "Rolling Shutters", desc: "Aluminum rolling shutters to hide appliances." },
    { url: "/modular_cutlery.webp", title: "Cutlery Trays", desc: "Organized PVC cutlery inserts in the top drawer." }
  ],
  modern: [
    { url: "/modern_handleless.webp", title: "Handleless Profiles", desc: "Gola profiles for a sleek, handle-free look." },
    { url: "/modern_builtin.webp", title: "Built-In Appliances", desc: "Seamlessly integrated ovens and microwaves." },
    { url: "/modern_acrylic.webp", title: "Acrylic High Gloss", desc: "Scratch-resistant premium 2mm acrylic finishes." },
    { url: "/modern_quartz.webp", title: "Quartz Countertops", desc: "Stain-resistant, pure white engineered quartz." },
    { url: "/modern_profile.webp", title: "Profile Lighting", desc: "LED profile strips routed into cabinetry bottoms." },
    { url: "/modern_island.webp", title: "Island Kitchen", desc: "Spacious central island with breakfast counter." },
    { url: "/modern_tinted.webp", title: "Tinted Glass Flaps", desc: "Black tinted glass with black aluminum frames." },
    { url: "/modern_pu.webp", title: "Matte PU Paint", desc: "Luxurious polyurethane matte painted shutters." }
  ],
  minimal: [
    { url: "/minimal_monochrome.webp", title: "Monochrome Palette", desc: "Strict adherence to a calming two-tone color scale." },
    { url: "/minimal_kitchen.webp", title: "Hidden Hardware", desc: "Push-to-open mechanisms for zero visual noise." },
    { url: "/minimal_open_shelving.webp", title: "Open Shelving", desc: "A single open floating shelf for curated ceramics." },
    { url: "/minimal_matte.webp", title: "Matte Finishes", desc: "Anti-fingerprint ultra-matte laminate surfaces." },
    { url: "/minimal_integrated_sink.webp", title: "Integrated Sink", desc: "Undermount sink for a perfectly flush countertop." },
    { url: "/minimal_concealed_hood.webp", title: "Concealed Hood", desc: "Chimney fully integrated and hidden in overheads." },
    { url: "/minimal_seamless_backsplash.webp", title: "Seamless Backsplash", desc: "Using the same quartz on counters running up the wall." },
    { url: "/minimal_organized_clutter.webp", title: "Organized Clutter", desc: "Zero appliances left on the countertop." }
  ],
  l_shape: [
    { url: "/l_shape_maximizing.webp", title: "Maximizing Space", desc: "The classic L-shape providing perfect work-triangle efficiency." },
    { url: "/l_shape_corner_carousels.webp", title: "Corner Carousels", desc: "Utilizing deep corners effectively with swivel trays." },
    { url: "/l_shape_wicker.webp", title: "Wicker Integration", desc: "Breathable baskets woven right into the layout." },
    { url: "/l_shape_integrated_ovens.webp", title: "Integrated Ovens", desc: "Appliances securely placed at ergonomic eye levels." },
    { url: "/l_shape_long_counter.webp", title: "Long Counter Space", desc: "Uninterrupted quartz counters perfect for heavy meal prep." },
    { url: "/l_shape_smart_sink.webp", title: "Smart Sink Placement", desc: "Strategically located sink for uninterrupted workflow flow." },
    { url: "/l_shape_handleless.webp", title: "Continuous Lines", desc: "Handleless designs keep the L-shape looking long." },
    { url: "/l_shape_profile_lighting.webp", title: "Under-Cabinet Lighting", desc: "Illuminating the entire L-shaped counter evenly." }
  ],
  open: [
    { url: "/open_living_integration.webp", title: "Living Space Integration", desc: "Flows perfectly into the dining and living area." },
    { url: "/open_breakfast_island.webp", title: "Breakfast Island", desc: "The perfect bridge between kitchen and living room." },
    { url: "/open_bar_seating.webp", title: "Bar Seating", desc: "Casual seating for entertaining guests while cooking." },
    { url: "/open_subtle_tones.webp", title: "Subtle Tones", desc: "Colors that match the living room aesthetics seamlessly." },
    { url: "/open_hidden_chimney.webp", title: "Hidden Chimney", desc: "Keeping the visual sightlines clear to the living room." },
    { url: "/open_display_cabinets.webp", title: "Display Cabinets", desc: "Tinted glass flaps for showing off premium glassware." },
    { url: "/open_tall_storage.webp", title: "Tall Storage", desc: "Keeping all clutter hidden away from guests' view." },
    { url: "/open_premium_finishes.webp", title: "Premium Finishes", desc: "High quality edge-banding visibly stunning from any angle." }
  ],
  u_shape: [
    { url: "/u_shape_kitchen.webp", title: "U-Shape Dominance", desc: "Three uninterrupted walls providing massive storage capacity." },
    { url: "/u_shape_double_tall_units.webp", title: "Double Tall Units", desc: "Space for multiple full-height pantry solutions side-by-side." },
    { url: "/u_shape_bank_of_drawers.webp", title: "Bank of Drawers", desc: "Endless heavy-duty tandem drawers mapped on all three sides." },
    { url: "/u_shape_reflective_gloss.webp", title: "Reflective Gloss", desc: "Acrylic finish to make the dense U-shape feel open and airy." },
    { url: "/u_shape_window_sink.webp", title: "Window Sink", desc: "Classic U-shape trick: the primary sink facing the main window." },
    { url: "/u_shape_double_blind_corners.webp", title: "Double Blind Corners", desc: "Smart hardware to conquer both deep corners effectively." },
    { url: "/u_shape_massive_organizers.webp", title: "Massive Organizers", desc: "Dedicated wide zones for all different utensil types." },
    { url: "/u_shape_multi_appliance.webp", title: "Multi-Appliance Setup", desc: "Room for dishwasher, oven, and microwave fully built-in." }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const photoModal = document.getElementById('photoGalleryModal');
  const photoGrid = document.getElementById('galleryPhotoGrid');
  const modalTitle = document.getElementById('galleryModeTitle');
  const closeGalleryBtn = document.getElementById('closeGalleryBtn');

  // Globally expose the function to inline onclick handlers
  window.openGallery = function (type) {
    if (!galleryData[type] || !photoModal || !photoGrid) return;
    photoGrid.innerHTML = '';

    const titleMap = {
      modular: "Modular Kitchen Details",
      modern: "Modern Kitchen Details",
      minimal: "Minimal Kitchen Details",
      l_shape: "L-Shape Kitchen Details",
      u_shape: "U-Shape Kitchen Details",
      open: "Open Kitchen Details"
    };
    if (modalTitle) modalTitle.innerText = titleMap[type] || "Gallery Details";

    galleryData[type].forEach(item => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.innerHTML = `
        <img src="${item.url}" alt="${item.title}" />
        <div class="photo-info">
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
        </div>
      `;
      photoGrid.appendChild(card);
    });

    photoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      photoModal.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => { photoGrid.innerHTML = ''; }, 300);
    });
  }

  if (photoModal) {
    photoModal.addEventListener('click', (e) => {
      if (e.target === photoModal && closeGalleryBtn) {
        closeGalleryBtn.click();
      }
    });
  }
});

// ==========================================
// WhatsApp Floating Button Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const waContainer = document.createElement('div');
  waContainer.className = 'whatsapp-wrapper';

  const waTooltip = document.createElement('div');
  waTooltip.className = 'whatsapp-chat-bubble';
  
  const generateWaLink = (msg) => `https://wa.me/918810627815?text=${encodeURIComponent(msg)}`;

  waTooltip.innerHTML = `
    <div class="chat-header">
      <div class="chat-avatar"><img src="/custom-logo.webp" alt="Gharwaala Support"></div>
      <div class="chat-title">
        <h4>Gharwaala Support</h4>
        <span class="online-status">Typically replies instantly</span>
      </div>
      <button class="chat-close-btn" aria-label="Close chat">&times;</button>
    </div>
    <div class="chat-body">
      <p>Hi there! 👋 How can we help you build your dream kitchen?</p>
      <div class="chat-options">
        <a href="${generateWaLink('Hi Gharwaala Team! ✨ I would like to get a free estimate for my kitchen.')}" target="_blank" class="chat-option-btn">Get a Free Estimate</a>
        <a href="${generateWaLink('Hi! I would like to book a free consultation for my kitchen.')}" target="_blank" class="chat-option-btn">Book a Consultation</a>
        <a href="${generateWaLink('Hi! Can you share some of your previous designs and portfolio?')}" target="_blank" class="chat-option-btn">See Portfolio</a>
        <a href="${generateWaLink('Hi! I want to know more about the materials you use and your warranty.')}" target="_blank" class="chat-option-btn">Materials & Warranty</a>
      </div>
    </div>
  `;

  const waButton = document.createElement('button');
  waButton.className = 'whatsapp-floating-btn';
  waButton.setAttribute('aria-label', 'Open WhatsApp Chat');
  waButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  `;
  
  waContainer.appendChild(waTooltip);
  waContainer.appendChild(waButton);
  document.body.appendChild(waContainer);

  const toggleChat = () => waTooltip.classList.toggle('visible');
  waButton.addEventListener('click', toggleChat);
  waTooltip.querySelector('.chat-close-btn').addEventListener('click', toggleChat);

  // Show tooltip after 30 seconds (non-intrusive, let user explore first)
  setTimeout(() => {
    if(!waTooltip.classList.contains('visible')) {
      waTooltip.classList.add('visible');
    }
  }, 30000);
});

// ==========================================
// ============================================
// 1. Intersection Observer for Scroll Animations
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll Reveal Animations
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, revealOptions);

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => revealObserver.observe(el));

  // 2. Dynamic Number Counters
  const counterOptions = {
    threshold: 0.5,
    rootMargin: "0px"
  };

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000; // ms
    const step = target / (duration / 16); // 60fps
    let current = 0;

    const updateCounter = () => {
      current += step;
      if (current < target) {
        el.innerText = Math.ceil(current);
        requestAnimationFrame(updateCounter);
      } else {
        el.innerText = target;
      }
    };
    updateCounter();
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, counterOptions);

  const counterElements = document.querySelectorAll('.counter');
  counterElements.forEach(el => counterObserver.observe(el));

  // 3. Parallax Backgrounds
  const parallaxElements = document.querySelectorAll('.parallax-bg');
  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      parallaxElements.forEach(el => {
        const speed = el.getAttribute('data-speed') || 0.4;
        // offset from top of screen
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          const yPos = -(scrolled * speed);
          el.style.backgroundPosition = `center ${yPos}px`;
        }
      });
    }, { passive: true });
  }

  // 4. Before/After Slider Logic
  const baSliders = document.querySelectorAll('.ba-slider');
  baSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const container = e.target.closest('.ba-slider-container');
      if (container) {
        container.style.setProperty('--position', `${e.target.value}%`);
      }
    });
  });

  // 4b. Transformations Carousel Logic
  const transTrack = document.getElementById('transformationsTrack');
  const transSlides = document.querySelectorAll('#transformationsTrack .carousel-slide');
  const transDotsContainer = document.getElementById('transformationsDots');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (transTrack && transSlides.length > 0) {
    // Generate dots
    transSlides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        transTrack.scrollTo({
          left: transSlides[idx].offsetLeft - transTrack.offsetLeft,
          behavior: 'smooth'
        });
      });
      transDotsContainer.appendChild(dot);
    });

    const dots = transDotsContainer.querySelectorAll('.dot');

    // Update active dot on scroll
    transTrack.addEventListener('scroll', () => {
      const scrollPosition = transTrack.scrollLeft;
      const slideWidth = transSlides[0].offsetWidth;
      const activeIndex = Math.round(scrollPosition / slideWidth);
      
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[activeIndex]) {
        dots[activeIndex].classList.add('active');
      }
    });

    // Arrow Buttons
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        transTrack.scrollBy({ left: -transSlides[0].offsetWidth, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        transTrack.scrollBy({ left: transSlides[0].offsetWidth, behavior: 'smooth' });
      });
    }
  }

  // 5. Dynamic Glassmorphic Navbar
  const navbar = document.querySelector('.navbar');
  const homeHero = document.querySelector('.home-hero');
  if (navbar) {
    if (!homeHero) {
      // If there's no dark hero image at the top (inner pages), 
      // the navbar should be permanently in the 'scrolled' (dark) state.
      navbar.classList.add('scrolled');
    } else {
      // Only apply scroll transparency logic if there's a dark hero image
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }, { passive: true });
    }
  }

  // --- Mobile Slideshow Logic ---
  const mobileDots = document.querySelectorAll('.mobile-slideshow-dots .dot');
  const slideSteps = document.querySelectorAll('.step-block');
  const slideImgs = document.querySelectorAll('.experience-step-img');
  
  if (mobileDots.length > 0) {
    let currentSlide = 0;
    let slideInterval;

    const goToSlide = (index) => {
      // Don't run on desktop where dots are hidden
      if (window.innerWidth > 992) return;

      mobileDots.forEach(d => d.classList.remove('active'));
      slideSteps.forEach(s => s.classList.remove('active'));
      slideImgs.forEach(i => i.classList.remove('active'));
      
      if (mobileDots[index]) mobileDots[index].classList.add('active');
      if (slideSteps[index]) slideSteps[index].classList.add('active');
      if (slideImgs[index]) slideImgs[index].classList.add('active');
      currentSlide = index;
    };

    const nextSlide = () => {
      if (window.innerWidth > 992) return;
      const next = (currentSlide + 1) % mobileDots.length;
      goToSlide(next);
    };

    const startSlideshow = () => {
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 4000); // 4 seconds per slide
    };

    mobileDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goToSlide(idx);
        startSlideshow(); // Reset timer on manual click
      });
    });

    // Only start slideshow if on mobile
    if (window.innerWidth <= 992) {
      startSlideshow();
    }
    
    // --- Touch Swipe Support ---
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;
    
    const expVisualsContainer = document.querySelector('.experience-visuals');
    if (expVisualsContainer) {
      expVisualsContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      expVisualsContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }
    
    const handleSwipe = () => {
      if (window.innerWidth > 992) return; // Only process on mobile
      
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance < 0) {
          // Swiped left, go to next
          const next = (currentSlide + 1) % mobileDots.length;
          goToSlide(next);
        } else {
          // Swiped right, go to prev
          const prev = (currentSlide - 1 + mobileDots.length) % mobileDots.length;
          goToSlide(prev);
        }
        startSlideshow(); // Reset timer on manual interaction
      }
    };

    // Listen for resize to start/stop
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 992) {
        startSlideshow();
      } else {
        clearInterval(slideInterval);
        // We handle desktop active state via IntersectionObserver now
      }
    });
  }

  // --- Desktop Scroll Spy Logic ---
  if (slideSteps.length > 0 && slideImgs.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px', // Trigger when image is roughly in the center
      threshold: 0
    };

    const scrollSpyObserver = new IntersectionObserver((entries) => {
      if (window.innerWidth <= 992) return; // Only run on desktop

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Find index of the intersecting image
          const index = Array.from(slideImgs).indexOf(entry.target);
          if (index !== -1) {
            slideSteps.forEach(s => s.classList.remove('active'));
            if (slideSteps[index]) slideSteps[index].classList.add('active');
          }
        }
      });
    }, observerOptions);

    slideImgs.forEach(img => scrollSpyObserver.observe(img));
  }
});
