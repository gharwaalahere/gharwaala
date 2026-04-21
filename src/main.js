
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
  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  
  if(mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // --- Lead Form Modal Logic ---
  const modal = document.getElementById('leadModal');
  const triggerBtns = document.querySelectorAll('.cta-trigger');
  const closeBtn = document.getElementById('closeModal');

  // --- Timeline Dynamic Scroll Animation Logic ---
  const timelineContainer = document.querySelector('.timeline-container');
  const scrollLine = document.getElementById('timeline-scroll-line');
  const timelineSteps = document.querySelectorAll('.timeline-step');
  
  if (timelineContainer && scrollLine) {
    window.addEventListener('scroll', () => {
      // Calculate continuous scroll progress mapped to the container height
      const containerRect = timelineContainer.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.65; // triggering point
      
      const progressPixels = Math.max(0, viewportCenter - containerRect.top);
      let percentage = (progressPixels / containerRect.height) * 100;
      percentage = Math.min(100, Math.max(0, percentage)); // clamp between 0-100
      
      scrollLine.style.height = `${percentage}%`;

      // Activate step cards exactly when the scroll line hits them
      timelineSteps.forEach(step => {
        const stepRect = step.getBoundingClientRect();
        // If the element has scrolled up into the active viewport zone
        if (stepRect.top < viewportCenter) {
          step.classList.add('active');
        } else {
          // Removes active state if scrolled back up (optional dynamic feel)
          step.classList.remove('active');
        }
      });
    });
    
    // Initialize state instantly on load
    window.dispatchEvent(new Event('scroll'));
  }

  // Open Modal
  if (triggerBtns.length > 0 && modal) {
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.add('active');
      });
    });
  }

  // Success Popup Close globally accessible
  window.closeSuccessPopup = function() {
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

    if (!/^[6-9]\d{9}$/.test(finalPhone)) {
      formMsg.textContent = "Please enter a valid 10-digit Indian mobile number.";
      formMsg.classList.add('error');
      return; // halt submission if invalid
    }
    phone = finalPhone; // use clean 10-digit number for db/email

    // Reconstruct full location string for db compatibility
    const location = city === 'Other' ? 'Other City' : `${locality}, ${city}`;
    const budget = formData.get('budget');

    // UI Feedback: Loading
    submitBtn.textContent = 'Submitting...';
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
            alert("Email Notification Failed: " + w3Json.message);
          } else {
            console.log("Web3Forms Email Sent Successfully!", w3Json);
          }
        } catch(err) {
          console.error("Web3Forms Network Error:", err);
          alert("Email Network Error: " + err.message);
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

    } catch (err) {
      console.error("Supabase Error:", err);
      formMsg.textContent = "Failed to submit request. Please try again.";
      formMsg.classList.add('error');
    } finally {
      // Revert UI
      submitBtn.textContent = 'Submit Request';
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
    { url: "/modular_corner.jpg", title: "Smart Corner Storage", desc: "Magic corner units making use of blind spots." },
    { url: "/modular_tandem.jpg", title: "Tandem Drawers", desc: "Heavy-duty tandem boxes for large utensils." },
    { url: "/modular_overhead.jpg", title: "Overhead Cabinets", desc: "Hydraulic lift-ups for easy overhead access." },
    { url: "/modular_pantry.jpg", title: "Tall Pantry", desc: "Pull-out pantry units for massive grocery storage." },
    { url: "/modular_wicker.jpg", title: "Wicker Baskets", desc: "Integrated woven wicker baskets for dry vegetables." },
    { url: "/modular_sink.jpg", title: "Under-Sink Utility", desc: "Detergent racks and bin holders under the sink." },
    { url: "/modular_shutter.jpg", title: "Rolling Shutters", desc: "Aluminum rolling shutters to hide appliances." },
    { url: "/modular_cutlery.jpg", title: "Cutlery Trays", desc: "Organized PVC cutlery inserts in the top drawer." }
  ],
  modern: [
    { url: "/modern_handleless.jpg", title: "Handleless Profiles", desc: "Gola profiles for a sleek, handle-free look." },
    { url: "/modern_builtin.jpg", title: "Built-In Appliances", desc: "Seamlessly integrated ovens and microwaves." },
    { url: "/modern_acrylic.jpg", title: "Acrylic High Gloss", desc: "Scratch-resistant premium 2mm acrylic finishes." },
    { url: "/modern_quartz.jpg", title: "Quartz Countertops", desc: "Stain-resistant, pure white engineered quartz." },
    { url: "/modern_profile.jpg", title: "Profile Lighting", desc: "LED profile strips routed into cabinetry bottoms." },
    { url: "/modern_island.jpg", title: "Island Kitchen", desc: "Spacious central island with breakfast counter." },
    { url: "/modern_tinted.jpg", title: "Tinted Glass Flaps", desc: "Black tinted glass with black aluminum frames." },
    { url: "/modern_pu.jpg", title: "Matte PU Paint", desc: "Luxurious polyurethane matte painted shutters." }
  ],
  minimal: [
    { url: "/minimal_monochrome.jpg", title: "Monochrome Palette", desc: "Strict adherence to a calming two-tone color scale." },
    { url: "/minimal_kitchen.jpg", title: "Hidden Hardware", desc: "Push-to-open mechanisms for zero visual noise." },
    { url: "/open_kitchen.jpg", title: "Open Shelving", desc: "A single open floating shelf for curated ceramics." },
    { url: "/modern_acrylic.jpg", title: "Matte Finishes", desc: "Anti-fingerprint ultra-matte laminate surfaces." },
    { url: "/modern_quartz.jpg", title: "Integrated Sink", desc: "Undermount sink for a perfectly flush countertop." },
    { url: "/modular_overhead.jpg", title: "Concealed Hood", desc: "Chimney fully integrated and hidden in overheads." },
    { url: "/modern_builtin.jpg", title: "Seamless Backsplash", desc: "Using the same quartz on counters running up the wall." },
    { url: "/u_shape_kitchen.jpg", title: "Organized Clutter", desc: "Zero appliances left on the countertop." }
  ],
  l_shape: [
    { url: "/l_shape_kitchen.jpg", title: "Maximizing Space", desc: "The classic L-shape providing perfect work-triangle efficiency." },
    { url: "/modular_corner.jpg", title: "Corner Carousels", desc: "Utilizing deep corners effectively with swivel trays." },
    { url: "/modular_wicker.jpg", title: "Wicker Integration", desc: "Breathable baskets woven right into the layout." },
    { url: "/modern_builtin.jpg", title: "Integrated Ovens", desc: "Appliances securely placed at ergonomic eye levels." },
    { url: "/modern_quartz.jpg", title: "Long Counter Space", desc: "Uninterrupted quartz counters perfect for heavy meal prep." },
    { url: "/modular_sink.jpg", title: "Smart Sink Placement", desc: "Strategically located sink for uninterrupted workflow flow." },
    { url: "/modern_handleless.jpg", title: "Continuous Lines", desc: "Handleless designs keep the L-shape looking long." },
    { url: "/modern_profile.jpg", title: "Under-Cabinet Lighting", desc: "Illuminating the entire L-shaped counter evenly." }
  ],
  open: [
    { url: "/open_kitchen.jpg", title: "Living Space Integration", desc: "Flows perfectly into the dining and living area." },
    { url: "/modern_island.jpg", title: "Breakfast Island", desc: "The perfect bridge between kitchen and living room." },
    { url: "/hero_kitchen_bg_v3.jpg", title: "Bar Seating", desc: "Casual seating for entertaining guests while cooking." },
    { url: "/minimal_monochrome.jpg", title: "Subtle Tones", desc: "Colors that match the living room aesthetics seamlessly." },
    { url: "/modular_overhead.jpg", title: "Hidden Chimney", desc: "Keeping the visual sightlines clear to the living room." },
    { url: "/modern_tinted.jpg", title: "Display Cabinets", desc: "Tinted glass flaps for showing off premium glassware." },
    { url: "/modular_pantry.jpg", title: "Tall Storage", desc: "Keeping all clutter hidden away from guests' view." },
    { url: "/premium_modular_kitchen_v4.jpg", title: "Premium Finishes", desc: "High quality edge-banding visibly stunning from any angle." }
  ],
  u_shape: [
    { url: "/u_shape_kitchen.jpg", title: "U-Shape Dominance", desc: "Three uninterrupted walls providing massive storage capacity." },
    { url: "/modular_pantry.jpg", title: "Double Tall Units", desc: "Space for multiple full-height pantry solutions side-by-side." },
    { url: "/modular_tandem.jpg", title: "Bank of Drawers", desc: "Endless heavy-duty tandem drawers mapped on all three sides." },
    { url: "/modern_acrylic.jpg", title: "Reflective Gloss", desc: "Acrylic finish to make the dense U-shape feel open and airy." },
    { url: "/modular_sink.jpg", title: "Window Sink", desc: "Classic U-shape trick: the primary sink facing the main window." },
    { url: "/modular_corner.jpg", title: "Double Blind Corners", desc: "Smart hardware to conquer both deep corners effectively." },
    { url: "/modular_cutlery.jpg", title: "Massive Organizers", desc: "Dedicated wide zones for all different utensil types." },
    { url: "/modern_builtin.jpg", title: "Multi-Appliance Setup", desc: "Room for dishwasher, oven, and microwave fully built-in." }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const photoModal = document.getElementById('photoGalleryModal');
  const photoGrid = document.getElementById('galleryPhotoGrid');
  const modalTitle = document.getElementById('galleryModeTitle');
  const closeGalleryBtn = document.getElementById('closeGalleryBtn');

  // Globally expose the function to inline onclick handlers
  window.openGallery = function(type) {
    if(!galleryData[type] || !photoModal || !photoGrid) return;
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
        <img src="${item.url}" alt="${item.title}" loading="lazy" />
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
