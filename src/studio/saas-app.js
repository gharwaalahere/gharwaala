import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 1. Supabase Initialization & Constants
// ============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const web3FormsKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '76f0462d-4d97-4c84-9357-0c7ddfb1a780';

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEYS = {
  USER: 'gw_saas_user_v1',
  STATE: 'gw_saas_state_v1',
  PROJECTS: 'gw_saas_projects_v1',
  LEDGER: 'gw_saas_ledger_v1'
};

// ============================================================================
// 2. Style Library & Dynamic Delhi NCR Pricing Engine
// ============================================================================
const STYLE_LIBRARY = {
  minimalist: {
    title: 'Matte Cashmere Greige',
    shortTitle: 'Matte Greige',
    defaultAfter: '/true_after_kitchen_1.jpg',
    baseMinLakhs: 4.2,
    baseMaxLakhs: 5.4,
    prompt: 'modern minimalist handleless kitchen, cashmere greige matte PU cabinets, seamless Calacatta white quartz countertop and matching splashback, warm 3000K undercabinet LED strip lighting, photorealistic luxury interior design, 8k photo'
  },
  japandi: {
    title: 'Japandi Fluted Oak',
    shortTitle: 'Japandi Oak',
    defaultAfter: '/true_after_kitchen_5.jpg',
    baseMinLakhs: 5.2,
    baseMaxLakhs: 6.6,
    prompt: 'Japandi kitchen interior with fluted natural oak base cabinets, off-white upper cabinets, pristine white quartz waterfall countertop, minimalist warm brass faucet, ambient warm lighting, architectural digest photo'
  },
  charcoal: {
    title: 'Charcoal & Champagne Gold',
    shortTitle: 'Charcoal & Brass',
    defaultAfter: '/true_after_kitchen_4.jpg',
    baseMinLakhs: 5.8,
    baseMaxLakhs: 7.5,
    prompt: 'ultra luxury dark charcoal matte modular kitchen with champagne gold channel handles, dramatic veined Calacatta marble countertop, suspended brass pendant lights, built-in black glass appliances'
  },
  sage: {
    title: 'Matte Sage Green European',
    shortTitle: 'Matte Sage Green',
    defaultAfter: '/true_after_kitchen_6.jpg',
    baseMinLakhs: 3.9,
    baseMaxLakhs: 4.9,
    prompt: 'contemporary European parallel kitchen with matte sage green cabinets, pure white composite countertop, concealed gas cylinder pullout, fluted glass backsplash, brass gooseneck faucet, architectural photography'
  },
  walnut: {
    title: 'Smoked Walnut & Statuario',
    shortTitle: 'Walnut & Marble',
    defaultAfter: '/true_after_kitchen_2.jpg',
    baseMinLakhs: 5.6,
    baseMaxLakhs: 7.2,
    prompt: 'luxury modern kitchen with smoked walnut wood veneer cabinets, Italian Statuario white marble countertop and island, bronze tinted glass upper display cabinets with warm interior LED lighting, 8k architectural photography'
  },
  acrylic: {
    title: 'Pure High-Gloss Acrylic Monochrome',
    shortTitle: 'Acrylic Monochrome',
    defaultAfter: '/true_after_kitchen_3.jpg',
    baseMinLakhs: 4.5,
    baseMaxLakhs: 5.9,
    prompt: 'sleek high-gloss pearl white and graphite acrylic modular kitchen, handleless Gola profile channels, integrated built-in oven tower, reflective pristine quartz counter, modern Indian luxury apartment'
  }
};

const HARDWARE_MODIFIERS = {
  core: {
    marine: { label: 'IS:710 Boiling Water Proof (BWP) Marine Ply', delta: 0.2 },
    hdhmr: { label: 'Action Tesa HDHMR Moisture-Resistant Board', delta: 0.0 },
    stainless: { label: '304 Grade Stainless Steel Hygiene Carcass', delta: 0.65 }
  },
  hardware: {
    blum: { label: 'Blum Austria Legrabox & Aventos Lift-Up Systems', delta: 0.35 },
    hettich: { label: 'Hettich Germany InnoTech Atira Soft-Close', delta: 0.15 },
    hafele: { label: 'Hafele Germany Matrix Box & LeMans Corner', delta: 0.25 }
  },
  countertop: {
    quartz_calacatta: { label: '20mm Calacatta Gold Engineered Quartz', delta: 0.25 },
    quartz_white: { label: 'Pure Crystal White Seamless Quartz', delta: 0.15 },
    ceramic: { label: '15mm Italian Slimline Sintered Porcelain Slab', delta: 0.45 },
    granite: { label: 'Polished Jet Black South Indian Granite', delta: -0.15 }
  }
};

// ============================================================================
// 3. Application State Management
// ============================================================================
let currentUser = null; // { id, email, name, phone, city }
let saasState = {
  credits: 2, // Guests get 2 starter trial renders; Account sign-up gives +5
  tier: 'Guest Explorer',
  accountBonusClaimed: false,
  phoneVerified: false,
  referralClaimed: false,
  siteAuditBooked: false,
  referralCode: 'GW-' + Math.random().toString(36).substring(2, 7).toUpperCase()
};

let savedProjects = [];
let creditLedger = [];
let activeFilter = 'all';
let pendingSaveAfterAuth = false;

// Studio Canvas State
let currentOriginalImage = '/before_kitchen.jpg';
let currentTransformedImage = '/true_after_kitchen_1.jpg';
let activeSampleTargetAfter = '/true_after_kitchen_1.jpg';
let isCustomUserUpload = false;
let selectedStyle = 'minimalist';
let selectedStructureMode = 'seg';
let currentViewMode = 'split';
let isDraggingSlider = false;

// ============================================================================
// 4. Local & Cloud Persistence Helpers
// ============================================================================
function loadLocalState() {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (rawUser) currentUser = JSON.parse(rawUser);

    const rawState = localStorage.getItem(STORAGE_KEYS.STATE);
    if (rawState) {
      saasState = { ...saasState, ...JSON.parse(rawState) };
    }

    const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (rawProjects) {
      savedProjects = JSON.parse(rawProjects);
    } else {
      // Seed 1 example project so the gallery looks rich out of the box
      savedProjects = [
        {
          id: 'sample-gurugram-1',
          title: 'DLF Phase 5 L-Shape Concept',
          styleKey: 'minimalist',
          styleTitle: 'Matte Cashmere Greige',
          beforeImage: '/before_kitchen.jpg',
          afterImage: '/true_after_kitchen_1.jpg',
          cabinetCore: 'marine',
          hardwareTier: 'blum',
          countertopSlab: 'quartz_calacatta',
          structureMode: 'seg',
          customPrompt: 'Warm 3000K profile lighting under overhead units',
          estimatedCost: '₹4.9L – ₹6.2L',
          isFavorite: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      saveProjectsLocal();
    }

    const rawLedger = localStorage.getItem(STORAGE_KEYS.LEDGER);
    if (rawLedger) {
      creditLedger = JSON.parse(rawLedger);
    } else {
      creditLedger = [
        {
          id: 'init-1',
          delta: 2,
          reason: 'Welcome Guest Studio Trial Credits',
          createdAt: new Date().toISOString()
        }
      ];
      saveLedgerLocal();
    }
  } catch (e) {
    console.warn('Error loading studio state:', e);
  }
}

function saveStateLocal() {
  localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(saasState));
  if (currentUser) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

function saveProjectsLocal() {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(savedProjects));
  } catch (e) {
    console.warn('Storage quota warning when saving base64 image locally:', e);
  }
}

function saveLedgerLocal() {
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(creditLedger));
}

function computeTierName() {
  if (saasState.siteAuditBooked) return 'VIP Audit Member';
  if (saasState.phoneVerified) return 'NCR Verified Pro';
  if (currentUser) return 'Homeowner Starter';
  return 'Guest Explorer';
}

function addCredits(delta, reason) {
  saasState.credits = Math.max(0, (saasState.credits || 0) + delta);
  saasState.tier = computeTierName();
  saveStateLocal();

  const entry = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    delta,
    reason,
    createdAt: new Date().toISOString()
  };
  creditLedger.unshift(entry);
  saveLedgerLocal();

  // Sync to Supabase if signed in with UUID
  if (supabase && currentUser?.isSupabaseUuid) {
    supabase.from('studio_profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.name,
      phone: currentUser.phone || null,
      city: currentUser.city || null,
      phone_verified: saasState.phoneVerified,
      site_audit_booked: saasState.siteAuditBooked,
      tier: saasState.tier,
      credits: saasState.credits,
      updated_at: new Date().toISOString()
    }).then(() => {});

    supabase.from('studio_credit_logs').insert({
      user_id: currentUser.id,
      delta,
      reason
    }).then(() => {});
  }

  refreshAllUI();
}

// ============================================================================
// 5. Toast Notification Helper
// ============================================================================
export function showToast(message, icon = '✨') {
  const container = document.getElementById('saasToastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'saas-toast';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 260);
  }, 3800);
}

// ============================================================================
// 6. View Switching (SPA Router)
// ============================================================================
export function switchSaaSView(viewName) {
  document.querySelectorAll('.saas-view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });
  document.querySelectorAll('.saas-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  refreshAllUI();
}

// ============================================================================
// 7. Dynamic Cost & Hardware Calculation
// ============================================================================
function getCurrentSpecs() {
  const coreKey = document.getElementById('cabinetCoreSelect')?.value || 'marine';
  const hwKey = document.getElementById('hardwareTierSelect')?.value || 'blum';
  const counterKey = document.getElementById('countertopSelect')?.value || 'quartz_calacatta';
  const upperCab = document.getElementById('upperCabinetSelect')?.value || 'preset';
  const lowerCab = document.getElementById('lowerCabinetSelect')?.value || 'preset';
  const backsplash = document.getElementById('backsplashSelect')?.value || 'continuous bookmatched Calacatta quartz slab backsplash';
  const lightingMood = document.getElementById('lightingMoodSelect')?.value || 'warm 3000K recessed under-cabinet LED profile strip lighting and cove glow';
  const strengthRaw = parseInt(document.getElementById('remodelStrengthSlider')?.value || '78', 10);
  const promptStrength = Number((strengthRaw / 100).toFixed(2));
  const customPrompt = document.getElementById('customPromptInput')?.value.trim() || '';

  const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;
  const coreObj = HARDWARE_MODIFIERS.core[coreKey] || HARDWARE_MODIFIERS.core.marine;
  const hwObj = HARDWARE_MODIFIERS.hardware[hwKey] || HARDWARE_MODIFIERS.hardware.blum;
  const counterObj = HARDWARE_MODIFIERS.countertop[counterKey] || HARDWARE_MODIFIERS.countertop.quartz_calacatta;

  const totalDelta = coreObj.delta + hwObj.delta + counterObj.delta;
  const minPrice = (styleConf.baseMinLakhs + totalDelta).toFixed(1);
  const maxPrice = (styleConf.baseMaxLakhs + totalDelta).toFixed(1);
  const costString = `₹${minPrice}L – ₹${maxPrice}L`;

  const zoneParts = [];
  if (upperCab !== 'preset') zoneParts.push(upperCab);
  if (lowerCab !== 'preset') zoneParts.push(lowerCab);
  if (backsplash) zoneParts.push(backsplash);
  if (lightingMood) zoneParts.push(lightingMood);

  const hasCustomZones = (upperCab !== 'preset') || (lowerCab !== 'preset') || (customPrompt.length > 0);

  return {
    coreKey,
    hwKey,
    counterKey,
    upperCab,
    lowerCab,
    backsplash,
    lightingMood,
    promptStrength,
    strengthRaw,
    hasCustomZones,
    zonePromptString: zoneParts.join(', '),
    coreLabel: coreObj.label,
    hardwareLabel: hwObj.label,
    countertopLabel: counterObj.label,
    customPrompt,
    costString,
    summary: `Cabinet Core: ${coreObj.label}, Hardware: ${hwObj.label}, Countertop: ${counterObj.label}`
  };
}

function updatePriceAndSpecsUI() {
  const specs = getCurrentSpecs();
  const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;

  const strengthLabel = document.getElementById('remodelStrengthValue');
  if (strengthLabel) {
    let modeText = 'Balanced Remodel';
    if (specs.strengthRaw <= 65) modeText = 'Keep Exact Cabinets';
    else if (specs.strengthRaw >= 84) modeText = 'Bold Structural Re-Design';
    strengthLabel.textContent = `${specs.strengthRaw}% (${modeText})`;
  }

  const estEl = document.getElementById('estimatedCostText');
  if (estEl) estEl.textContent = specs.costString;

  const coreEl = document.getElementById('auditRecommendedCore');
  if (coreEl) coreEl.textContent = specs.coreLabel;

  const finishEl = document.getElementById('auditRecommendedFinish');
  if (finishEl) {
    finishEl.textContent = (specs.upperCab !== 'preset' || specs.lowerCab !== 'preset')
      ? `${styleConf.shortTitle} + Custom Dual-Zone`
      : styleConf.title;
  }

  const counterEl = document.getElementById('auditRecommendedCountertop');
  if (counterEl) counterEl.textContent = specs.countertopLabel;

  const layoutEl = document.getElementById('auditDetectedLayout');
  if (layoutEl) {
    layoutEl.textContent = `ControlNet Lock (${specs.strengthRaw}% Remodel Intensity)`;
  }

  const blueprintEl = document.getElementById('auditBlueprintText');
  if (blueprintEl) {
    const extraNote = specs.customPrompt ? ` Custom brief integrated: "${specs.customPrompt}".` : '';
    const zoneNote = (specs.upperCab !== 'preset' || specs.lowerCab !== 'preset')
      ? ` Customized zones: ${specs.zonePromptString}.`
      : '';
    blueprintEl.textContent = `Reconfiguring your kitchen perspective with ${styleConf.title}, ${specs.coreLabel}, ${specs.hardwareLabel}, and seamless ${specs.countertopLabel}.${zoneNote}${extraNote}`;
  }

  const waBtn = document.getElementById('whatsappChatBtn');
  if (waBtn) {
    const msg = encodeURIComponent(
      `Hi Gharwaala, I designed a ${styleConf.title} kitchen (${specs.costString}) using your AI Kitchen Studio (${specs.coreLabel} + ${specs.hardwareLabel}). I'd like to schedule a free 3D site audit.`
    );
    waBtn.href = `https://wa.me/918810627815?text=${msg}`;
  }
}

// ============================================================================
// 8. Image Optimization for Fast Upload & Reliable AI Generation
// ============================================================================
function compressAndNormalizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 9. Studio Canvas & AI Transformation Pipeline
// ============================================================================
function loadInputImage(src, labelName) {
  currentOriginalImage = src;
  const uploadStatusText = document.getElementById('uploadStatusText');
  const stageStatusText = document.getElementById('stageStatusText');
  const stageEmptyState = document.getElementById('stageEmptyState');
  const saasComparisonWrap = document.getElementById('saasComparisonWrap');
  const saasImgBefore = document.getElementById('saasImgBefore');
  const saasImgAfter = document.getElementById('saasImgAfter');
  const resetCanvasBtn = document.getElementById('resetCanvasBtn');

  if (uploadStatusText) uploadStatusText.textContent = labelName ? `Loaded: ${labelName}` : 'Photo Ready';
  if (stageStatusText) stageStatusText.textContent = 'Kitchen loaded. Choose style & click Transform.';
  if (saasImgBefore) saasImgBefore.src = src;
  if (stageEmptyState) stageEmptyState.style.display = 'none';
  if (saasComparisonWrap) saasComparisonWrap.style.display = 'block';

  if (isCustomUserUpload) {
    if (saasImgAfter) saasImgAfter.src = src;
    setSliderPercent(100);
  }
  if (resetCanvasBtn) resetCanvasBtn.style.display = 'inline-flex';
}

function setSliderPercent(pct) {
  const wrap = document.getElementById('saasComparisonWrap');
  if (!wrap) return;
  const clamped = Math.max(0, Math.min(100, pct));
  wrap.style.setProperty('--slider-pos', `${clamped}%`);
}

async function runTransformationPipeline() {
  const generateBtn = document.getElementById('generateTransformationBtn');
  const btnGenerateText = document.getElementById('btnGenerateText');
  const saasLoadingOverlay = document.getElementById('saasLoadingOverlay');
  const loadingStepText = document.getElementById('loadingStepText');
  const loadingSubText = document.getElementById('loadingSubText');
  const loadingProgressFill = document.getElementById('loadingProgressFill');
  const saasImgAfter = document.getElementById('saasImgAfter');
  const stageStatusText = document.getElementById('stageStatusText');
  const remodelAuditCard = document.getElementById('remodelAuditCard');
  const forceLiveCheck = document.getElementById('forceLiveAiCheckbox');

  const specs = getCurrentSpecs();
  const runLiveAi = isCustomUserUpload || specs.hasCustomZones || (forceLiveCheck && forceLiveCheck.checked);

  // Check credits when running a custom/live AI transformation
  if (runLiveAi && saasState.credits <= 0) {
    showToast('You have 0 AI credits remaining. Unlock free credits in the Credits Hub!', '⚡');
    if (!currentUser) {
      openModal('authModal');
    } else {
      switchSaaSView('credits');
    }
    return;
  }

  generateBtn.disabled = true;
  btnGenerateText.textContent = 'Transforming Kitchen...';
  saasLoadingOverlay.style.display = 'flex';
  loadingProgressFill.style.width = '15%';

  try {
    let resultImageUrl = null;
    const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;

    if (runLiveAi) {
      loadingStepText.textContent = 'Preparing Room Geometry...';
      loadingSubText.textContent = `Applying ${specs.strengthRaw}% remodel intensity while preserving room boundaries...`;
      loadingProgressFill.style.width = '30%';

      // Ensure relative sample URL is converted to data URL if user customized zones or forced live AI on a sample
      let inputImagePayload = currentOriginalImage;
      if (inputImagePayload.startsWith('/')) {
        const sampleResp = await fetch(inputImagePayload);
        const blob = await sampleResp.blob();
        inputImagePayload = await compressAndNormalizeImage(blob);
      }

      const customExtra = specs.customPrompt ? `, ${specs.customPrompt}` : '';
      const zoneExtra = specs.zonePromptString ? `, ${specs.zonePromptString}` : '';
      const fullPrompt = `${styleConf.prompt}${zoneExtra}${customExtra}, ${specs.countertopLabel}, photorealistic luxury modular kitchen interior design, architectural digest 8k`;

      loadingStepText.textContent = 'Executing ControlNet SDXL Render...';
      loadingSubText.textContent = 'Synthesizing custom cabinetry, backsplash, quartz reflections, and lighting on GPU...';
      loadingProgressFill.style.width = '55%';

      const ticker = setInterval(() => {
        const cur = parseFloat(loadingProgressFill.style.width) || 55;
        if (cur < 88) loadingProgressFill.style.width = `${cur + 3}%`;
      }, 1500);

      let resp;
      try {
        resp = await fetch('/api/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: inputImagePayload,
            prompt: fullPrompt,
            prompt_strength: specs.promptStrength,
            guidance_scale: 15
          })
        });
      } finally {
        clearInterval(ticker);
      }

      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Server error during transformation');
      }

      if (data.output) {
        resultImageUrl = data.output;
      } else if (data.id) {
        loadingStepText.textContent = 'Finalizing High-Resolution Render...';
        loadingProgressFill.style.width = '88%';
        let poll = data;
        while (poll.status !== 'succeeded' && poll.status !== 'failed' && poll.status !== 'canceled') {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/api/transform?id=${poll.id}`);
          poll = await pollRes.json();
        }
        if (poll.status === 'succeeded' && poll.output) {
          resultImageUrl = Array.isArray(poll.output) ? poll.output[poll.output.length - 1] : poll.output;
        } else {
          throw new Error(poll.error || 'Prediction did not succeed');
        }
      } else {
        throw new Error('No output image returned by model.');
      }

      // Deduct 1 credit on successful live AI generation
      addCredits(-1, `AI Kitchen Render: ${styleConf.shortTitle}`);
    } else {
      // Instant Sample Walkthrough
      const steps = [
        { progress: 28, title: 'Analyzing Structural Geometry...', desc: 'Segmenting wall boundaries, window placement, and cabinet heights.' },
        { progress: 58, title: 'Applying Material Finishes...', desc: `Synthesizing ${styleConf.title} with ${specs.hardwareLabel}.` },
        { progress: 85, title: 'Synthesizing Lighting & Quartz...', desc: `Rendering ${specs.countertopLabel} and 3000K profile channel glow.` },
        { progress: 98, title: 'Finalizing 4K Architectural Render...', desc: 'Optimizing perspective alignment and BOQ estimate.' }
      ];
      for (const s of steps) {
        await new Promise(r => setTimeout(r, 360));
        loadingProgressFill.style.width = `${s.progress}%`;
        loadingStepText.textContent = s.title;
        loadingSubText.textContent = s.desc;
      }
      resultImageUrl = styleConf.defaultAfter || activeSampleTargetAfter;
    }

    currentTransformedImage = resultImageUrl;
    if (saasImgAfter) saasImgAfter.src = currentTransformedImage;

    loadingProgressFill.style.width = '100%';
    await new Promise(r => setTimeout(r, 250));

    saasLoadingOverlay.style.display = 'none';
    generateBtn.disabled = false;
    btnGenerateText.textContent = 'Re-Generate Transformation';
    if (stageStatusText) stageStatusText.textContent = 'Transformation Complete! Drag slider or save to your workspace.';

    ['saveProjectBtn', 'shareRenderBtn', 'exportBoqBtn', 'downloadRenderBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'inline-flex';
    });

    setSliderPercent(50);
    updatePriceAndSpecsUI();
    if (remodelAuditCard) remodelAuditCard.style.display = 'block';
    showToast(`Rendered in ${styleConf.shortTitle} style!`, '🎨');
  } catch (err) {
    console.error('Transformation error:', err);
    saasLoadingOverlay.style.display = 'none';
    generateBtn.disabled = false;
    btnGenerateText.textContent = 'Retry Transformation';
    showToast(err.message || 'Render service busy. Please retry.', '⚠️');
  }
}

// ============================================================================
// 10. Save Project to Cloud Workspace (Requires Login)
// ============================================================================
async function handleSaveProject() {
  if (!currentOriginalImage || !currentTransformedImage) {
    showToast('Generate a kitchen transformation first before saving.', 'ℹ️');
    return;
  }

  // Enforce "login required to save renders"
  if (!currentUser) {
    pendingSaveAfterAuth = true;
    showToast('Sign in or create a free account (+5 Credits) to save renders to your Cloud Workspace.', '🔒');
    openModal('authModal');
    return;
  }

  const titleInput = document.getElementById('projectTitleInput');
  const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;
  const specs = getCurrentSpecs();
  const projectTitle = (titleInput && titleInput.value.trim())
    ? titleInput.value.trim()
    : `${styleConf.shortTitle} Kitchen Makeover`;

  const newProject = {
    id: 'gw-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    userId: currentUser.id,
    userEmail: currentUser.email,
    title: projectTitle,
    styleKey: selectedStyle,
    styleTitle: styleConf.title,
    beforeImage: currentOriginalImage,
    afterImage: currentTransformedImage,
    cabinetCore: specs.coreKey,
    hardwareTier: specs.hwKey,
    countertopSlab: specs.counterKey,
    structureMode: selectedStructureMode,
    customPrompt: specs.customPrompt,
    estimatedCost: specs.costString,
    isFavorite: false,
    createdAt: new Date().toISOString()
  };

  savedProjects.unshift(newProject);
  saveProjectsLocal();

  // Attempt cloud sync to Supabase studio_projects
  if (supabase) {
    try {
      await supabase.from('studio_projects').upsert({
        id: newProject.id,
        user_id: currentUser.isSupabaseUuid ? currentUser.id : null,
        user_email: currentUser.email,
        title: newProject.title,
        style_key: newProject.styleKey,
        style_title: newProject.styleTitle,
        before_image: newProject.beforeImage,
        after_image: newProject.afterImage,
        cabinet_core: newProject.cabinetCore,
        hardware_tier: newProject.hardwareTier,
        countertop_slab: newProject.countertopSlab,
        structure_mode: newProject.structureMode,
        custom_prompt: newProject.customPrompt,
        estimated_cost: newProject.estimatedCost,
        is_favorite: false,
        is_public: true
      });
    } catch (err) {
      console.warn('Cloud project sync fallback to local:', err);
    }
  }

  refreshAllUI();
  showToast(`Saved "${newProject.title}" to your workspace!`, '💾');
}

// ============================================================================
// 11. Shareable Public Links (?share=...)
// ============================================================================
function buildShareUrl(projectObj) {
  const styleConf = STYLE_LIBRARY[projectObj.styleKey] || STYLE_LIBRARY.minimalist;
  // Compact payload for URL sharing (works immediately across any browser if images are URLs, or pairs with project ID)
  const isBeforeUrl = !projectObj.beforeImage.startsWith('data:');
  const isAfterUrl = !projectObj.afterImage.startsWith('data:');

  const sharePayload = {
    id: projectObj.id || ('sh-' + Date.now().toString(36)),
    t: projectObj.title || `${styleConf.shortTitle} Concept`,
    s: projectObj.styleKey || 'minimalist',
    c: projectObj.cabinetCore || 'marine',
    h: projectObj.hardwareTier || 'blum',
    k: projectObj.countertopSlab || 'quartz_calacatta',
    p: projectObj.estimatedCost || '₹4.5L – ₹5.8L',
    b: isBeforeUrl ? projectObj.beforeImage : '/before_kitchen.jpg',
    a: isAfterUrl ? projectObj.afterImage : styleConf.defaultAfter
  };

  const encoded = btoa(encodeURIComponent(JSON.stringify(sharePayload)));
  return `${window.location.origin}/transform.html?share=${encodeURIComponent(encoded)}&pid=${encodeURIComponent(sharePayload.id)}`;
}

function openShareModalForCurrentOrProject(projectOverride = null) {
  const specs = getCurrentSpecs();
  const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;
  const titleInput = document.getElementById('projectTitleInput');

  const proj = projectOverride || {
    id: 'gw-' + Date.now().toString(36),
    title: (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : `${styleConf.shortTitle} Makeover`,
    styleKey: selectedStyle,
    cabinetCore: specs.coreKey,
    hardwareTier: specs.hwKey,
    countertopSlab: specs.counterKey,
    estimatedCost: specs.costString,
    beforeImage: currentOriginalImage,
    afterImage: currentTransformedImage
  };

  const url = buildShareUrl(proj);
  const shareInput = document.getElementById('shareLinkInput');
  if (shareInput) shareInput.value = url;

  const waShareBtn = document.getElementById('shareWhatsappDirectBtn');
  if (waShareBtn) {
    const text = encodeURIComponent(
      `Check out my ${styleConf.title} modular kitchen makeover designed on Gharwaala AI Studio (${proj.estimatedCost}): ${url}`
    );
    waShareBtn.href = `https://wa.me/?text=${text}`;
  }

  openModal('shareModal');
}

async function checkAndLoadSharedUrl() {
  const params = new URLSearchParams(window.location.search);
  const shareParam = params.get('share');
  const pidParam = params.get('pid');

  if (!shareParam && !pidParam) return;

  try {
    let loaded = null;

    // 1. Check if pid exists in Supabase studio_projects
    if (supabase && pidParam) {
      const { data } = await supabase
        .from('studio_projects')
        .select('*')
        .eq('id', pidParam)
        .maybeSingle();
      if (data) {
        loaded = {
          title: data.title,
          styleKey: data.style_key,
          beforeImage: data.before_image,
          afterImage: data.after_image,
          cabinetCore: data.cabinet_core,
          hardwareTier: data.hardware_tier,
          countertopSlab: data.countertop_slab,
          estimatedCost: data.estimated_cost
        };
      }
    }

    // 2. Decode compact URL payload if not fetched from DB
    if (!loaded && shareParam) {
      const parsed = JSON.parse(decodeURIComponent(atob(shareParam)));
      loaded = {
        title: parsed.t,
        styleKey: parsed.s || 'minimalist',
        beforeImage: parsed.b || '/before_kitchen.jpg',
        afterImage: parsed.a || '/true_after_kitchen_1.jpg',
        cabinetCore: parsed.c || 'marine',
        hardwareTier: parsed.h || 'blum',
        countertopSlab: parsed.k || 'quartz_calacatta',
        estimatedCost: parsed.p || '₹4.5L – ₹5.8L'
      };
    }

    if (loaded) {
      applyProjectToStudio(loaded);
      const banner = document.getElementById('sharedRenderBanner');
      const bannerTitle = document.getElementById('sharedBannerTitle');
      if (banner && bannerTitle) {
        banner.classList.add('active');
        bannerTitle.textContent = `Viewing Shared Kitchen Concept: "${loaded.title}" (${loaded.estimatedCost})`;
      }
      showToast(`Loaded shared kitchen design: ${loaded.title}`, '🔗');
    }
  } catch (e) {
    console.warn('Could not parse shared link parameter:', e);
  }
}

function applyProjectToStudio(proj) {
  selectedStyle = STYLE_LIBRARY[proj.styleKey] ? proj.styleKey : 'minimalist';
  document.querySelectorAll('.preset-card').forEach(c => {
    c.classList.toggle('active', c.dataset.style === selectedStyle);
  });

  const titleInput = document.getElementById('projectTitleInput');
  if (titleInput && proj.title) titleInput.value = proj.title;

  const coreSel = document.getElementById('cabinetCoreSelect');
  if (coreSel && proj.cabinetCore) coreSel.value = proj.cabinetCore;

  const hwSel = document.getElementById('hardwareTierSelect');
  if (hwSel && proj.hardwareTier) hwSel.value = proj.hardwareTier;

  const counterSel = document.getElementById('countertopSelect');
  if (counterSel && proj.countertopSlab) counterSel.value = proj.countertopSlab;

  const promptInput = document.getElementById('customPromptInput');
  if (promptInput) promptInput.value = proj.customPrompt || '';

  currentOriginalImage = proj.beforeImage;
  currentTransformedImage = proj.afterImage;
  isCustomUserUpload = proj.beforeImage.startsWith('data:');

  const saasImgBefore = document.getElementById('saasImgBefore');
  const saasImgAfter = document.getElementById('saasImgAfter');
  const stageEmptyState = document.getElementById('stageEmptyState');
  const saasComparisonWrap = document.getElementById('saasComparisonWrap');
  const remodelAuditCard = document.getElementById('remodelAuditCard');

  if (saasImgBefore) saasImgBefore.src = currentOriginalImage;
  if (saasImgAfter) saasImgAfter.src = currentTransformedImage;
  if (stageEmptyState) stageEmptyState.style.display = 'none';
  if (saasComparisonWrap) saasComparisonWrap.style.display = 'block';
  if (remodelAuditCard) remodelAuditCard.style.display = 'block';

  ['saveProjectBtn', 'shareRenderBtn', 'exportBoqBtn', 'downloadRenderBtn', 'resetCanvasBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'inline-flex';
  });

  setSliderPercent(50);
  updatePriceAndSpecsUI();
}

// ============================================================================
// 12. Printable / PDF Architectural BOQ & Spec Sheet Generator
// ============================================================================
function exportArchitecturalBoqSpec() {
  const specs = getCurrentSpecs();
  const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;
  const titleInput = document.getElementById('projectTitleInput');
  const projectTitle = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : `${styleConf.title} Kitchen`;
  const voucherCode = saasState.referralCode || 'GW-NCR15K';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const win = window.open('', '_blank');
  if (!win) {
    showToast('Please allow popups to download your PDF Specification Sheet.', '📄');
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Gharwaala Architectural BOQ & Spec Sheet - ${projectTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; color: #18181b; margin: 0; padding: 36px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d5b45f; padding-bottom: 18px; margin-bottom: 24px; }
    .brand { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #09090b; }
    .sub { font-size: 12px; color: #71717a; }
    .images-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
    .img-box { border: 1px solid #e4e4e7; border-radius: 10px; overflow: hidden; }
    .img-box img { width: 100%; height: 220px; object-fit: cover; display: block; }
    .img-caption { padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #f4f4f5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th, td { border: 1px solid #e4e4e7; padding: 11px 14px; text-align: left; }
    th { background: #18181b; color: #d5b45f; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .voucher { background: #fef9c3; border: 1px dashed #ca8a04; padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
    @media print { .no-print { display: none; } body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background:#d5b45f;color:#09090b;border:none;padding:10px 18px;border-radius:6px;font-weight:700;cursor:pointer;">🖨️ Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="brand">GHARWAALA · AI KITCHEN STUDIO</div>
      <div class="sub">Architectural Specification & Delhi NCR Turnkey Estimate · Generated ${dateStr}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; color: #71717a;">Estimated Turnkey Investment</div>
      <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #a16207;">${specs.costString}</div>
    </div>
  </div>

  <h2 style="margin: 0 0 14px; font-size: 18px;">Project: ${projectTitle}</h2>

  <div class="images-row">
    <div class="img-box">
      <img src="${currentOriginalImage}" alt="Before Kitchen" />
      <div class="img-caption">Before · Existing Room Geometry</div>
    </div>
    <div class="img-box">
      <img src="${currentTransformedImage}" alt="After Kitchen" />
      <div class="img-caption">After · ${styleConf.title} (ControlNet Render)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Specification Module</th>
        <th>Selected Material / Brand</th>
        <th>Warranty & Execution Standard</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Target Aesthetic & Shutter Finish</strong></td>
        <td>${styleConf.title}</td>
        <td>Factory-pressed edge-banded precision shutters</td>
      </tr>
      <tr>
        <td><strong>Cabinet Carcass Core</strong></td>
        <td>${specs.coreLabel}</td>
        <td>10-Year Gharwaala Structural Warranty</td>
      </tr>
      <tr>
        <td><strong>Drawer & Hinge Hardware</strong></td>
        <td>${specs.hardwareLabel}</td>
        <td>Manufacturer Lifetime Cycle Warranty</td>
      </tr>
      <tr>
        <td><strong>Countertop & Backsplash Slab</strong></td>
        <td>${specs.countertopLabel}</td>
        <td>Laser-measured seamless mitred installation</td>
      </tr>
      <tr>
        <td><strong>Task Lighting & Electrical</strong></td>
        <td>3000K Warm Aluminium Profile LED Channels</td>
        <td>Concealed wiring & sensor dimmer ready</td>
      </tr>
    </tbody>
  </table>

  <div class="voucher">
    <div>
      <strong>🎁 Gharwaala Studio Execution Benefit: ₹15,000 Hardware Upgrade Voucher</strong>
      <div style="font-size: 12px; color: #52525b;">Present this specification sheet during your Free 3D Laser Site Audit in Delhi, Gurugram, Noida, or Faridabad.</div>
    </div>
    <div style="font-weight: 800; font-size: 15px; background: #fff; padding: 6px 12px; border-radius: 6px; border: 1px solid #ca8a04;">Code: ${voucherCode}</div>
  </div>

  <p style="font-size: 11.5px; color: #71717a; margin-top: 22px; text-align: center;">
    Gharwaala Modular Kitchens · Delhi NCR · +91 88106 27815 · https://gharwaala.com
  </p>
</body>
</html>`);
  win.document.close();
}

// ============================================================================
// 13. UI Rendering for Dashboard, Saved Projects, and Credits Hub
// ============================================================================
function refreshAllUI() {
  saasState.tier = computeTierName();

  // 1. Header Credits & User Account Pill
  const navCreditCount = document.getElementById('navCreditCount');
  if (navCreditCount) navCreditCount.textContent = saasState.credits;

  const navTierBadge = document.getElementById('navTierBadge');
  if (navTierBadge) navTierBadge.textContent = saasState.tier;

  const navProjectsCount = document.getElementById('navProjectsCount');
  if (navProjectsCount) navProjectsCount.textContent = savedProjects.length;

  const userAccountBtnText = document.getElementById('userAccountBtnText');
  const userAvatarDot = document.getElementById('userAvatarDot');
  if (currentUser) {
    if (userAccountBtnText) userAccountBtnText.textContent = currentUser.name || currentUser.email.split('@')[0];
    if (userAvatarDot) userAvatarDot.textContent = (currentUser.name || currentUser.email || 'U')[0].toUpperCase();
  } else {
    if (userAccountBtnText) userAccountBtnText.textContent = 'Sign In (+5⚡)';
    if (userAvatarDot) userAvatarDot.textContent = '👤';
  }

  // 2. Dashboard Metrics & Quests
  const dashWelcomeTitle = document.getElementById('dashWelcomeTitle');
  if (dashWelcomeTitle) {
    dashWelcomeTitle.textContent = currentUser
      ? `Welcome back, ${currentUser.name || currentUser.email.split('@')[0]}`
      : 'Welcome to Gharwaala AI Kitchen Studio';
  }

  const kpiCredits = document.getElementById('kpiCredits');
  if (kpiCredits) kpiCredits.textContent = `${saasState.credits} ⚡`;

  const kpiProjects = document.getElementById('kpiProjects');
  if (kpiProjects) kpiProjects.textContent = savedProjects.length;

  const kpiTier = document.getElementById('kpiTier');
  if (kpiTier) kpiTier.textContent = saasState.tier;

  renderQuestsList();
  renderProjectsGallery();
  renderCreditsHub();
}

function renderQuestsList() {
  const container = document.getElementById('dashboardQuestsList');
  if (!container) return;

  const quests = [
    {
      done: !!currentUser,
      title: 'Create Free Homeowner Account',
      desc: 'Unlock Cloud Project Storage & +5 Free AI Render Credits',
      reward: '+5 ⚡',
      actionLabel: currentUser ? 'Completed ✓' : 'Sign In / Join',
      onClick: () => !currentUser && openModal('authModal')
    },
    {
      done: saasState.phoneVerified,
      title: 'Verify Delhi NCR Mobile Number',
      desc: 'Unlock priority BOQ PDF exports & +5 Bonus Credits',
      reward: '+5 ⚡',
      actionLabel: saasState.phoneVerified ? 'Verified ✓' : 'Verify Phone',
      onClick: () => !saasState.phoneVerified && openModal('verifyPhoneModal')
    },
    {
      done: saasState.referralClaimed,
      title: 'Share Studio With a Friend or Neighbour',
      desc: `Share your referral link (${saasState.referralCode}) on WhatsApp`,
      reward: '+3 ⚡',
      actionLabel: saasState.referralClaimed ? 'Shared ✓' : 'Share & Claim +3⚡',
      onClick: () => triggerReferralShare()
    },
    {
      done: saasState.siteAuditBooked,
      title: 'Book Free 3D Laser Site Audit in Delhi NCR',
      desc: 'Senior architect home visit with laminate/quartz samples + 15 VIP Credits',
      reward: '+15 ⚡',
      actionLabel: saasState.siteAuditBooked ? 'Booked ✓' : 'Book Free Audit',
      onClick: () => openModal('consultModal')
    }
  ];

  container.innerHTML = quests.map((q, idx) => `
    <div class="quest-item ${q.done ? 'completed' : ''}">
      <div class="quest-left">
        <div class="quest-icon">${q.done ? '✓' : '⚡'}</div>
        <div>
          <h4 class="quest-title">${q.title}</h4>
          <p class="quest-desc">${q.desc}</p>
        </div>
      </div>
      <button class="${q.done ? 'nav-btn-outline' : 'nav-btn-gold'}" data-quest-idx="${idx}" ${q.done ? 'disabled' : ''}>
        ${q.done ? q.actionLabel : `${q.actionLabel} (${q.reward})`}
      </button>
    </div>
  `).join('');

  container.querySelectorAll('button[data-quest-idx]').forEach(btn => {
    const idx = parseInt(btn.dataset.questIdx, 10);
    btn.addEventListener('click', () => quests[idx].onClick());
  });
}

function renderProjectsGallery() {
  const grid = document.getElementById('savedProjectsGrid');
  const dashRecent = document.getElementById('dashboardRecentProjects');
  const guestBanner = document.getElementById('projectsGuestBanner');

  if (guestBanner) {
    guestBanner.style.display = currentUser ? 'none' : 'flex';
  }

  const filtered = savedProjects.filter(p => {
    if (activeFilter === 'favorites') return p.isFavorite;
    return true;
  });

  const renderCardsHtml = (list) => {
    if (list.length === 0) {
      return `
        <div class="saas-panel-card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
          <h3>No Saved Kitchen Projects Yet</h3>
          <p>Transform a kitchen photo in the Studio Workspace and click "Save Project" to build your personal design collection.</p>
          <button class="nav-btn-gold" onclick="window.switchSaaSView('studio')">Go to Studio Workspace ↗</button>
        </div>
      `;
    }
    return list.map(p => `
      <article class="project-card" data-pid="${p.id}">
        <div class="project-thumb-wrap">
          <img src="${p.afterImage}" alt="${p.title}" class="project-thumb-after" />
          <img src="${p.beforeImage}" alt="Before" class="project-thumb-before-pip" title="Original Kitchen" />
          <button class="project-fav-btn ${p.isFavorite ? 'active' : ''}" data-action="fav" data-pid="${p.id}" title="Toggle Favorite">
            ${p.isFavorite ? '★' : '☆'}
          </button>
        </div>
        <div class="project-card-body">
          <h4 class="project-card-title">${p.title}</h4>
          <div class="project-meta-tags">
            <span class="meta-tag gold">${p.styleTitle}</span>
            <span class="meta-tag">${p.estimatedCost}</span>
          </div>
          <div class="project-card-actions">
            <button class="nav-btn-gold" data-action="open" data-pid="${p.id}" style="flex:1; justify-content:center;">Open in Studio</button>
            <button class="nav-btn-outline" data-action="share" data-pid="${p.id}" title="Share Link">🔗 Share</button>
            <button class="nav-btn-outline" data-action="delete" data-pid="${p.id}" title="Delete Project">🗑</button>
          </div>
        </div>
      </article>
    `).join('');
  };

  if (grid) {
    grid.innerHTML = renderCardsHtml(filtered);
    bindProjectCardEvents(grid);
  }

  if (dashRecent) {
    dashRecent.innerHTML = renderCardsHtml(savedProjects.slice(0, 2));
    bindProjectCardEvents(dashRecent);
  }
}

function bindProjectCardEvents(container) {
  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.pid;
      const action = btn.dataset.action;
      const proj = savedProjects.find(item => item.id === pid);
      if (!proj) return;

      if (action === 'open') {
        applyProjectToStudio(proj);
        switchSaaSView('studio');
        showToast(`Loaded "${proj.title}" into Studio`, '🎨');
      } else if (action === 'share') {
        openShareModalForCurrentOrProject(proj);
      } else if (action === 'fav') {
        proj.isFavorite = !proj.isFavorite;
        saveProjectsLocal();
        refreshAllUI();
      } else if (action === 'delete') {
        savedProjects = savedProjects.filter(item => item.id !== pid);
        saveProjectsLocal();
        if (supabase) {
          supabase.from('studio_projects').delete().eq('id', pid).then(() => {});
        }
        refreshAllUI();
        showToast('Project removed from workspace.', '🗑');
      }
    });
  });
}

function renderCreditsHub() {
  const referralCodeDisplay = document.getElementById('userReferralCodeDisplay');
  if (referralCodeDisplay) referralCodeDisplay.textContent = saasState.referralCode;

  const ledgerBody = document.getElementById('creditLedgerTableBody');
  if (ledgerBody) {
    ledgerBody.innerHTML = creditLedger.slice(0, 12).map(row => {
      const dateFormatted = new Date(row.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const sign = row.delta > 0 ? `+${row.delta} ⚡` : `${row.delta} ⚡`;
      const cls = row.delta > 0 ? 'credit-delta-pos' : 'credit-delta-neg';
      return `
        <tr>
          <td>${row.reason}</td>
          <td class="${cls}">${sign}</td>
          <td style="color: var(--saas-subtle);">${dateFormatted}</td>
        </tr>
      `;
    }).join('');
  }
}

function triggerReferralShare() {
  const refUrl = `${window.location.origin}/transform.html?ref=${encodeURIComponent(saasState.referralCode)}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(refUrl).catch(() => {});
  }
  const waMsg = encodeURIComponent(
    `Hey! Try Gharwaala's free AI Kitchen Transformation Studio to redesign your kitchen photo in 3D: ${refUrl}`
  );
  window.open(`https://wa.me/?text=${waMsg}`, '_blank', 'noopener');

  if (!saasState.referralClaimed) {
    saasState.referralClaimed = true;
    addCredits(3, `Referral Link Shared (${saasState.referralCode})`);
    showToast('Referral link shared! +3 Bonus AI Credits unlocked!', '🎁');
  } else {
    showToast('Referral link copied & opened in WhatsApp!', '🔗');
  }
}

// ============================================================================
// 14. Modals & Authentication Flows
// ============================================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function validateIndianMobile(rawPhone) {
  const clean = (rawPhone || '').replace(/\D/g, '');
  let finalPhone = clean;
  if (finalPhone.length === 12 && finalPhone.startsWith('91')) finalPhone = finalPhone.substring(2);
  else if (finalPhone.length === 11 && finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
  const isValid = /^[6-9]\d{9}$/.test(finalPhone) && !/^(.)\1{9}$/.test(finalPhone);
  return { isValid, finalPhone };
}

async function submitLeadNotification(subjectPrefix, payloadDetails) {
  const submissionTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // 1. Web3Forms notification
  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: web3FormsKey,
        subject: `${subjectPrefix} - Gharwaala AI Studio SaaS`,
        from_name: 'Gharwaala AI Studio SaaS',
        email: 'notifications@gharwaala.com',
        ...payloadDetails,
        'Submitted At (IST)': submissionTime
      })
    });
  } catch (e) {
    console.warn('Web3Forms notification warning:', e);
  }

  // 2. Supabase leads table insert
  if (supabase && payloadDetails.Phone) {
    try {
      await supabase.from('leads').insert([
        {
          name: payloadDetails.Name || 'Studio User',
          phone: payloadDetails.Phone,
          location: payloadDetails.City || 'Delhi NCR',
          budget: payloadDetails.Budget || 'AI Studio Lead'
        }
      ]);
    } catch (e) {
      console.warn('Supabase leads insert warning:', e);
    }
  }
}

// ============================================================================
// 15. DOM Initialization & Event Binding
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  window.switchSaaSView = switchSaaSView;
  window.openSaaSModal = openModal;
  window.closeSaaSModal = closeModal;

  // Bind Top Navigation View Tabs
  document.querySelectorAll('.saas-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSaaSView(btn.dataset.view));
  });

  // Bind Credit Meter Pill -> Credits View
  const creditPill = document.getElementById('creditMeterPill');
  if (creditPill) {
    creditPill.addEventListener('click', () => switchSaaSView('credits'));
  }

  // Bind User Account Button
  const userAccountBtn = document.getElementById('userAccountBtn');
  if (userAccountBtn) {
    userAccountBtn.addEventListener('click', () => {
      if (currentUser) {
        openModal('accountProfileModal');
        const profEmail = document.getElementById('profileModalEmail');
        const profTier = document.getElementById('profileModalTier');
        if (profEmail) profEmail.textContent = `${currentUser.name} (${currentUser.email})`;
        if (profTier) profTier.textContent = `${saasState.tier} · ${saasState.credits} Credits Remaining`;
      } else {
        openModal('authModal');
      }
    });
  }

  // Sign Out Button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      if (supabase) await supabase.auth.signOut().catch(() => {});
      currentUser = null;
      saveStateLocal();
      closeModal('accountProfileModal');
      refreshAllUI();
      showToast('Signed out of your studio account.', '👋');
    });
  }

  // Upload Dropzone & File Input
  const dropzoneBox = document.getElementById('dropzoneBox');
  const kitchenFileInput = document.getElementById('kitchenFileInput');

  if (dropzoneBox && kitchenFileInput) {
    dropzoneBox.addEventListener('click', () => kitchenFileInput.click());

    ['dragenter', 'dragover'].forEach(ev => {
      dropzoneBox.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzoneBox.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      dropzoneBox.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzoneBox.classList.remove('dragover');
      });
    });

    dropzoneBox.addEventListener('drop', async (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) await processUploadedFile(file);
    });

    kitchenFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) await processUploadedFile(file);
    });
  }

  async function processUploadedFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid JPG, PNG, or WebP image.', '⚠️');
      return;
    }
    isCustomUserUpload = true;
    document.querySelectorAll('.sample-pill').forEach(p => p.classList.remove('active'));
    showToast('Optimizing kitchen perspective...', '📷');
    const dataUrl = await compressAndNormalizeImage(file);
    loadInputImage(dataUrl, file.name);
  }

  // Sample Kitchen Selector Pills
  document.querySelectorAll('.sample-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.sample-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      isCustomUserUpload = false;

      const sampleBefore = btn.dataset.sampleBefore;
      activeSampleTargetAfter = btn.dataset.sampleAfter;
      loadInputImage(sampleBefore, btn.dataset.title);
      currentTransformedImage = activeSampleTargetAfter;
      const saasImgAfter = document.getElementById('saasImgAfter');
      if (saasImgAfter) saasImgAfter.src = currentTransformedImage;
      setSliderPercent(50);
    });
  });

  // Style Preset Cards
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedStyle = card.dataset.style;
      updatePriceAndSpecsUI();
      if (!isCustomUserUpload) {
        const conf = STYLE_LIBRARY[selectedStyle];
        if (conf) {
          currentTransformedImage = conf.defaultAfter;
          const saasImgAfter = document.getElementById('saasImgAfter');
          if (saasImgAfter) saasImgAfter.src = currentTransformedImage;
          setSliderPercent(50);
        }
      }
    });
  });

  // Structure Preservation Mode Pills
  document.querySelectorAll('.structure-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.structure-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedStructureMode = pill.dataset.structure || 'seg';
      updatePriceAndSpecsUI();
    });
  });

  // Hardware, Zone & Material Selectors
  [
    'cabinetCoreSelect',
    'hardwareTierSelect',
    'countertopSelect',
    'upperCabinetSelect',
    'lowerCabinetSelect',
    'backsplashSelect',
    'lightingMoodSelect',
    'remodelStrengthSlider',
    'customPromptInput'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updatePriceAndSpecsUI);
      el.addEventListener('input', updatePriceAndSpecsUI);
    }
  });

  // Viewport Mode Switcher (Split | Side-by-Side | After Only)
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentViewMode = btn.dataset.viewmode;
      const wrap = document.getElementById('saasComparisonWrap');
      if (!wrap) return;
      wrap.classList.remove('mode-sidebyside', 'mode-afteronly');
      if (currentViewMode === 'sidebyside') wrap.classList.add('mode-sidebyside');
      else if (currentViewMode === 'afteronly') wrap.classList.add('mode-afteronly');
    });
  });

  // Generate Button
  const generateBtn = document.getElementById('generateTransformationBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      if (!currentOriginalImage) {
        showToast('Please upload a kitchen photo or choose a sample first.', '📷');
        return;
      }
      runTransformationPipeline();
    });
  }

  // Stage Action Buttons
  document.getElementById('saveProjectBtn')?.addEventListener('click', handleSaveProject);
  document.getElementById('shareRenderBtn')?.addEventListener('click', () => openShareModalForCurrentOrProject(null));
  document.getElementById('exportBoqBtn')?.addEventListener('click', exportArchitecturalBoqSpec);

  document.getElementById('downloadRenderBtn')?.addEventListener('click', () => {
    if (!currentTransformedImage) return;
    const link = document.createElement('a');
    link.href = currentTransformedImage;
    link.target = '_blank';
    link.download = `gharwaala-kitchen-${selectedStyle}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.getElementById('resetCanvasBtn')?.addEventListener('click', () => {
    currentOriginalImage = null;
    currentTransformedImage = null;
    isCustomUserUpload = false;
    document.getElementById('stageEmptyState').style.display = 'block';
    document.getElementById('saasComparisonWrap').style.display = 'none';
    document.getElementById('remodelAuditCard').style.display = 'none';
    document.getElementById('kitchenFileInput').value = '';
  });

  // Interactive Comparison Slider Pointer Events
  const saasComparisonWrap = document.getElementById('saasComparisonWrap');
  if (saasComparisonWrap) {
    const onPointerMove = (e) => {
      if (!isDraggingSlider || currentViewMode !== 'split') return;
      const rect = saasComparisonWrap.getBoundingClientRect();
      const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      if (clientX === undefined) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSliderPercent(pct);
    };

    saasComparisonWrap.addEventListener('mousedown', (e) => {
      if (currentViewMode !== 'split') return;
      isDraggingSlider = true;
      onPointerMove(e);
    });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', () => { isDraggingSlider = false; });

    saasComparisonWrap.addEventListener('touchstart', (e) => {
      if (currentViewMode !== 'split') return;
      isDraggingSlider = true;
      onPointerMove(e);
    }, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', () => { isDraggingSlider = false; });
  }

  // Projects Filter Pills
  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderProjectsGallery();
    });
  });

  // Share Modal Copy Button
  document.getElementById('copyShareLinkBtn')?.addEventListener('click', () => {
    const inp = document.getElementById('shareLinkInput');
    if (inp) {
      inp.select();
      navigator.clipboard?.writeText(inp.value);
      showToast('Interactive share link copied to clipboard!', '🔗');
    }
  });

  // Referral Share Buttons in Credits Hub
  document.getElementById('claimReferralBtn')?.addEventListener('click', triggerReferralShare);

  // Auth Modal Form Handling
  const authForm = document.getElementById('saasAuthForm');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameVal = document.getElementById('authNameInput')?.value.trim() || 'Homeowner';
      const emailVal = document.getElementById('authEmailInput')?.value.trim() || '';
      const passVal = document.getElementById('authPasswordInput')?.value || '';
      const submitBtn = authForm.querySelector('button[type="submit"]');

      if (!emailVal) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing into Cloud Workspace...';

      let userId = 'usr-' + btoa(emailVal).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      let isSupabaseUuid = false;

      if (supabase && passVal.length >= 6) {
        try {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: emailVal,
            password: passVal
          });
          if (!signInErr && signInData?.user) {
            userId = signInData.user.id;
            isSupabaseUuid = true;
          } else {
            const { data: signUpData } = await supabase.auth.signUp({
              email: emailVal,
              password: passVal,
              options: { data: { full_name: nameVal } }
            });
            if (signUpData?.user) {
              userId = signUpData.user.id;
              isSupabaseUuid = true;
            }
          }
        } catch (authErr) {
          console.warn('Supabase Auth fallback to instant workspace session:', authErr);
        }
      }

      currentUser = {
        id: userId,
        isSupabaseUuid,
        name: nameVal,
        email: emailVal
      };

      if (!saasState.accountBonusClaimed) {
        saasState.accountBonusClaimed = true;
        addCredits(5, 'Account Sign-Up Bonus (+5 Starter Credits)');
        showToast(`Welcome ${nameVal}! +5 Free AI Render Credits added to your account.`, '🎉');
      } else {
        saveStateLocal();
        refreshAllUI();
        showToast(`Signed in as ${emailVal}`, '✨');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue to Studio Workspace ↗';
      closeModal('authModal');

      if (pendingSaveAfterAuth) {
        pendingSaveAfterAuth = false;
        handleSaveProject();
      }
    });
  }

  // Phone Verification Modal Handling (+5 Credits)
  const verifyPhoneForm = document.getElementById('verifyPhoneForm');
  if (verifyPhoneForm) {
    verifyPhoneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneRaw = document.getElementById('verifyPhoneInput')?.value || '';
      const cityVal = document.getElementById('verifyCityInput')?.value || 'Gurugram';
      const { isValid, finalPhone } = validateIndianMobile(phoneRaw);

      if (!isValid) {
        showToast('Please enter a valid 10-digit Indian mobile number.', '⚠️');
        return;
      }

      const btn = verifyPhoneForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Verifying...';

      if (currentUser) {
        currentUser.phone = finalPhone;
        currentUser.city = cityVal;
      }

      await submitLeadNotification(`📱 VERIFIED STUDIO USER (${cityVal})`, {
        Name: currentUser?.name || 'Verified Homeowner',
        Email: currentUser?.email || 'Not Provided',
        Phone: finalPhone,
        City: cityVal,
        Budget: document.getElementById('estimatedCostText')?.textContent || '₹4.5L – ₹6.0L'
      });

      if (!saasState.phoneVerified) {
        saasState.phoneVerified = true;
        addCredits(5, `Verified Delhi NCR Mobile (${cityVal})`);
        showToast('Mobile verified! +5 Bonus Credits & NCR Pro Badge unlocked!', '✅');
      } else {
        showToast('Mobile number updated!', '✅');
      }

      btn.disabled = false;
      btn.textContent = 'Verify & Claim +5 Credits ↗';
      closeModal('verifyPhoneModal');
    });
  }

  // Site Audit Consultation Modal Handling (+15 VIP Credits)
  const saasConsultForm = document.getElementById('saasConsultForm');
  if (saasConsultForm) {
    saasConsultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('leadName')?.value.trim() || '';
      const phoneRaw = document.getElementById('leadPhone')?.value || '';
      const city = document.getElementById('leadCity')?.value || 'Gurugram';
      const { isValid, finalPhone } = validateIndianMobile(phoneRaw);

      if (!isValid) {
        showToast('Please enter a valid 10-digit mobile number.', '⚠️');
        return;
      }

      const btn = saasConsultForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Booking 3D Site Audit...';

      const styleConf = STYLE_LIBRARY[selectedStyle] || STYLE_LIBRARY.minimalist;
      const specs = getCurrentSpecs();

      await submitLeadNotification(`🔔 NEW 3D SITE AUDIT: ${name} (${city})`, {
        Name: name,
        Phone: finalPhone,
        City: city,
        'Target Style': styleConf.title,
        'Hardware Specs': specs.summary,
        Budget: specs.costString
      });

      if (!saasState.siteAuditBooked) {
        saasState.siteAuditBooked = true;
        saasState.phoneVerified = true;
        addCredits(15, `VIP 3D Laser Site Audit Booked (${city})`);
      }

      btn.disabled = false;
      btn.textContent = 'Confirm Free Site Audit ↗';
      closeModal('consultModal');
      saasConsultForm.reset();
      showToast(`Site Audit confirmed for ${city}! +15 VIP Credits unlocked.`, '🏆');
    });
  }

  // Close Modals on Overlay Click
  document.querySelectorAll('.modal-overlay-saas').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Initial Startup Load
  loadInputImage('/before_kitchen.jpg', 'Cramped L-Shape');
  currentTransformedImage = '/true_after_kitchen_1.jpg';
  const saasImgAfter = document.getElementById('saasImgAfter');
  if (saasImgAfter) saasImgAfter.src = currentTransformedImage;
  setSliderPercent(50);
  updatePriceAndSpecsUI();
  refreshAllUI();
  checkAndLoadSharedUrl();
});
