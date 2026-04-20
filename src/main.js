
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

  // --- Timeline Animation Logic ---
  const timelineLine = document.getElementById('timeline-line');
  const timelineSteps = document.querySelectorAll('.timeline-step');
  
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if(entry.target.id === 'timeline-line') {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.add('in-view');
        }
      }
    });
  }, { threshold: 0.2 });

  if (timelineLine) timelineObserver.observe(timelineLine);
  timelineSteps.forEach((step, index) => {
    step.style.transitionDelay = `${index * 0.3}s`;
    timelineObserver.observe(step);
  });

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
    const phone = formData.get('phone');
    const city = formData.get('city');
    const locality = formData.get('locality') || '';

    // Reconstruct full location string for db compatibility
    const location = city === 'Other' ? 'Other City' : `${locality}, ${city}`;
    const budget = formData.get('budget');

    // UI Feedback: Loading
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      // Insert into Supabase table "leads"
      const { data, error } = await supabase
        .from('leads')
        .insert([
          { name, phone, location, budget }
        ]);

      if (error) {
        throw error;
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
