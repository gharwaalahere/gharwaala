
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

  // --- Lead Form Modal Logic ---Logic
  const modal = document.getElementById('leadModal');
  const triggerBtns = document.querySelectorAll('.cta-trigger');
  const closeBtn = document.getElementById('closeModal');

  // Open Modal
  if (triggerBtns.length > 0 && modal) {
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.add('active');
      });
    });
  }

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
    const location = formData.get('location');
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
      formMsg.textContent = "Thank you! Our team will contact you shortly.";
      formMsg.classList.add('success');
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
