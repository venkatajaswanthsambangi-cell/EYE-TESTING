/**
 * TEST YOUR EYES - Voice-Based Multilingual Digital Eyesight Screening System
 * Vanilla JavaScript Modular Architecture
 * 
 * Features:
 * - Reactive State Management
 * - Multilingual Dictionary (English, Telugu, Hindi, Tamil)
 * - Two-Way Web Speech Engine (SpeechSynthesis + SpeechRecognition)
 * - Tumbling E Visual Acuity Engine (OD & OS monocular tests)
 * - Sloan Alphabet Visual Acuity Engine (OD & OS monocular tests)
 * - Calibrated SVG Pseudoisochromatic Colour Plates
 * - Optional Auxiliary Tests (Contrast Sensitivity, Amsler Grid, Peripheral Vision)
 * - Results Generation & Printable Clinical Record
 * - Interactive 20-20-20 Rule Timer
 * - Dual Theme Switcher (Dark / Light) with LocalStorage
 */

// ==========================================================================
// 1. GLOBAL STATE & CONFIGURATION
// ==========================================================================
function generateSessionSeed() {
  return Math.floor(100000 + Math.random() * 900000);
}

const AppState = {
  theme: localStorage.getItem('tye_theme') || 'dark',
  language: localStorage.getItem('tye_lang') || 'en',
  currentSection: 'home',
  calibrationScale: parseFloat(localStorage.getItem('tye_calib')) || 1.0,
  sessionSeed: generateSessionSeed(),
  
  // Voice Engine State
  voice: {
    isListening: false,
    isSpeaking: false,
    supported: false,
    recognition: null,
    permission: 'unknown', // 'granted', 'denied', 'prompt'
    lastTranscript: '',
    missingVoiceForLang: false
  },

  // Tumbling E Screening State
  tumbling: {
    currentEye: 'OD', // 'OD' (Right) -> 'OS' (Left) -> 'done'
    stepIndex: 0,
    currentDirection: 'right', // 'up', 'down', 'left', 'right'
    levels: [
      { snellen: '20/200', baseFraction: 0.18, minPx: 26, maxPx: 36, logMAR: 1.0, label: 'Level 1' },
      { snellen: '20/100', baseFraction: 0.14, minPx: 22, maxPx: 28, logMAR: 0.7, label: 'Level 2' },
      { snellen: '20/70',  baseFraction: 0.11, minPx: 18, maxPx: 24, logMAR: 0.54, label: 'Level 3' },
      { snellen: '20/50',  baseFraction: 0.08, minPx: 15, maxPx: 20, logMAR: 0.4, label: 'Level 4' },
      { snellen: '20/30',  baseFraction: 0.06, minPx: 13, maxPx: 16, logMAR: 0.18, label: 'Level 5' },
      { snellen: '20/20',  baseFraction: 0.045, minPx: 10, maxPx: 13, logMAR: 0.0, label: 'Level 6' }
    ],
    odAnswers: [],
    osAnswers: [],
    odScore: 'Unresolved',
    osScore: 'Unresolved'
  },

  // Alphabet Acuity Screening State
  alphabet: {
    currentEye: 'OD',
    stepIndex: 0,
    currentLetter: 'E',
    currentChoices: ['E', 'D', 'C', 'P'],
    levels: [
      { snellen: '20/100', baseFraction: 0.15, minPx: 22, maxPx: 28, logMAR: 0.7, label: 'Level 1' },
      { snellen: '20/70',  baseFraction: 0.12, minPx: 18, maxPx: 24, logMAR: 0.54, label: 'Level 2' },
      { snellen: '20/50',  baseFraction: 0.09, minPx: 15, maxPx: 20, logMAR: 0.4, label: 'Level 3' },
      { snellen: '20/40',  baseFraction: 0.07, minPx: 13, maxPx: 17, logMAR: 0.3, label: 'Level 4' },
      { snellen: '20/25',  baseFraction: 0.055, minPx: 11, maxPx: 15, logMAR: 0.1, label: 'Level 5' },
      { snellen: '20/20',  baseFraction: 0.045, minPx: 10, maxPx: 13, logMAR: 0.0, label: 'Level 6' }
    ],
    letterPool: ['A', 'C', 'D', 'E', 'F', 'H', 'K', 'N', 'P', 'R', 'S', 'T', 'V', 'X', 'Z'],
    odAnswers: [],
    osAnswers: [],
    odScore: 'Unresolved',
    osScore: 'Unresolved'
  },

  // Colour Vision State
  colour: {
    currentPlateIndex: 0,
    answers: [],
    numberPool: ['12', '8', '5', '29', '74', '6', '3', '15', '16', '26', '45', '97'],
    plates: [],
    score: 0
  },

  // Optional Tests State
  optional: {
    contrastResult: 'Not Taken',
    amslerResult: 'Not Taken',
    peripheralResult: 'Not Taken'
  },

  // 20-20-20 Rule Timer
  timer: {
    remainingSeconds: 20 * 60,
    isRunning: false,
    intervalId: null,
    isBreakMode: false
  }
};

// ==========================================================================
// 2. MULTILINGUAL DICTIONARY (English, Telugu, Hindi, Tamil)
// ==========================================================================
const I18N_TRANSLATIONS = {
  en: {
    nav_tagline: 'Digital Vision Screening',
    voice_label: 'Voice Ready',
    disclaimer_title: 'Medical Disclaimer:',
    disclaimer_text: 'TEST YOUR EYES is an educational preliminary eyesight screening tool. It is not a substitute for a professional eye examination and cannot diagnose eye diseases.',
    step_language: 'Language',
    step_instructions: 'Instructions',
    step_tumbling: 'Tumbling E',
    step_alphabet: 'Alphabet',
    step_colour: 'Colour Vision',
    step_results: 'Results',
    hero_badge: 'Clinical Screening Technology • Voice-Assisted',
    hero_title_main: 'TEST YOUR EYES',
    hero_title_sub: 'SAVE YOUR EYES',
    hero_title_tagline: 'Save Your Eyes, Check Your Vision',
    hero_desc: 'An accessible, multilingual digital vision screening platform. Screen your visual acuity with calibrated Tumbling E and Snellen tests, assess colour perception, and receive immediate preliminary eye wellness reports with voice-guided support.',
    btn_start_screening: 'Start Eye Screening',
    btn_learn_more: 'Learn Eye Care',
    feat_multilingual_title: '4 Regional Languages',
    feat_multilingual_desc: 'English, Telugu, Hindi, Tamil',
    feat_voice_title: 'Voice-Assisted Prep',
    feat_voice_desc: 'Audio Prompts & Voice Cheatsheet',
    feat_report_title: 'Instant Summary',
    feat_report_desc: 'Monocular Analysis & Print Report',
    feat_header_sub: 'Comprehensive Battery',
    feat_header_title: 'Screening Capabilities',
    feat_header_desc: 'Scientifically structured preliminary optical tests designed for self-assessment.',
    card_tumbling_title: 'Tumbling E Acuity',
    card_tumbling_desc: 'Designed for all literacy levels. Detect the orientation of the letter E facing Up, Down, Left, or Right as font sizes progressively decrease.',
    card_tumbling_meta: 'Monocular (Right & Left)',
    card_alphabet_title: 'Alphabet Snellen Acuity',
    card_alphabet_desc: 'Standard Sloan and Snellen letter chart simulation. Recognise randomized standard optical optotypes across multiple visual acuity tiers.',
    card_alphabet_meta: 'Voice & Tap Enabled',
    card_colour_title: 'Colour Vision Plates',
    card_colour_desc: 'High-fidelity digital pseudoisochromatic plate simulations. Screen for red-green and blue-yellow colour perception variations.',
    card_colour_meta: 'Pseudoisochromatic',
    card_voice_title: 'Voice-Guided Screening',
    card_voice_desc: 'Complete speech-assisted guidance in Telugu, Hindi, Tamil, and English. Speak your answers or tap on-screen controls.',
    card_voice_meta: 'Multilingual Voice AI',
    btn_listen_results: 'Listen to Report',
    btn_listen_precautions: 'Listen to Precautions',
    btn_stop_audio: 'Stop Audio',
    lang_badge: 'Step 1 of Screening',
    lang_title: 'Choose Your Preferred Language',
    lang_subtitle: 'All visual instructions, prompts, and future audio synthesis will adapt to your selected language.',
    btn_back: 'Back',
    btn_confirm_lang: 'Confirm & Proceed to Instructions',
    inst_badge: 'Essential Setup',
    inst_title: 'How to Prepare for Accurate Screening',
    inst_subtitle: 'Follow these clinical standard ergonomics for the most dependable preliminary screening results.',
    inst_step1_tag: 'Step 1: Distance',
    inst_step1_title: 'Arm\'s Length Distance',
    inst_step1_desc: 'Position yourself approximately 40 – 50 cm away from your laptop or monitor. For mobile devices, hold at 35 – 40 cm.',
    inst_step1_tip: 'Do not lean forward during the test.',
    inst_step2_tag: 'Step 2: Lighting',
    inst_step2_title: 'Optimal Balanced Light',
    inst_step2_desc: 'Ensure your room is evenly illuminated with no direct glare, reflections, or harsh sunlight falling onto your screen.',
    inst_step2_tip: 'Turn off blue light filters/night mode for color accuracy.',
    inst_step3_tag: 'Step 3: Covering Eye',
    inst_step3_title: 'Cover Without Pressing',
    inst_step3_desc: 'Cup the palm of your hand gently over one eye. Never press against the eyeball or eyelids, as pressure temporarily blurs vision.',
    inst_step3_tip: 'Keep both eyes open behind your palm to prevent squinting.',
    inst_step4_tag: 'Step 4: Monocular Test',
    inst_step4_title: 'Why Test Each Eye Separately?',
    inst_step4_desc: 'The brain naturally compensates using the stronger eye. Testing each eye monocularly uncovers unilateral refractive errors or amblyopia.',
    inst_step4_tip: 'We test the Right Eye (OD) first, then Left Eye (OS).',
    btn_read_instructions: 'Listen to Instructions (Audio)',
    voice_input_ready_chip: 'Voice commands ready',
    btn_start_tumbling: 'Start Tumbling E Test',
    acuity_level_label: 'Acuity Level:',
    dir_up: 'UP',
    dir_down: 'DOWN',
    dir_left: 'LEFT',
    dir_right: 'RIGHT',
    btn_cant_see: 'I Cannot See Clearly / Too Small',
    btn_repeat_instruction: 'Repeat Audio Prompt',
    btn_restart_test: 'Restart Test',
    choose_letter_label: 'Select the matching letter:',
    tab_colour_vision: 'Colour Vision Screening',
    tab_optional_tests: 'Optional Vision Activities',
    plate_label: 'Plate',
    plate_accuracy_note: 'Digital pseudoisochromatic plate simulation for educational screening (not a certified printed Ishihara diagnostic test).',
    colour_question_title: 'What number or shape do you see in the circle?',
    colour_question_desc: 'Look at the dots for 3 to 5 seconds. Select the number formed by the dots:',
    btn_nothing_visible: 'Nothing is visible / Just random dots',
    optional_intro_title: 'Optional Specialized Vision Screenings',
    optional_intro_desc: 'Choose any of the three auxiliary tests below to screen for macular distortion, low-contrast sensitivity, or peripheral responsiveness.',
    btn_skip_to_results: 'Skip All • View Final Results',
    btn_proceed_results: 'Complete & Generate Results',
    res_screening_complete: 'Preliminary Screening Completed',
    res_dashboard_title: 'Your Digital Vision Report',
    res_overall_rating: 'Overall Performance',
    btn_print_report: 'Print Official Report',
    btn_view_report: 'View Summary',
    btn_restart_screening: 'Start New Screening',
    btn_go_to_learn: 'Explore Eye Care & 20-20-20 Rule',
    learn_badge: 'Eye Wellness & Education',
    learn_title: 'Understand Your Vision & Care For Your Eyes',
    learn_subtitle: 'Evidence-based guide to digital eye strain prevention, optical health habits, and when to seek medical attention.',
    audio_explainer_title: 'Listen to Personalized Vision Explanations',
    audio_explainer_desc: 'Our voice assistant explains your screening results, visual acuity metrics, and eye-strain preventive measures in your selected language.',
    audio_ready_status: 'Audio Summary: Ready for playback',
    timer_title: 'Interactive 20-20-20 Rule Timer',
    timer_desc: 'Every 20 minutes, look at an object 20 feet (6 meters) away for at least 20 seconds to relax your eye ciliary muscles.',
    edu_acuity_title: '1. Understanding Screening Results',
    edu_acuity_desc: '20/20 vision means you can resolve at 20 feet what a person with standard acuity sees at 20 feet. 20/40 means you must be 20 feet away to read what standard eyes see at 40 feet.',
    edu_refractive_title: '2. Common Vision Difficulties',
    edu_refractive_desc: 'Myopia (Nearsightedness): Distant objects blur. Hyperopia (Farsightedness): Close objects cause strain. Astigmatism: Imperfect cornea curvature causes ghosting. Presbyopia: Age-related reading difficulty.',
    edu_habits_title: '3. General Eye-Health Habits',
    edu_habits_desc: 'Blink consciously—when staring at digital screens, our blink rate drops from 15 times/minute to only 5–7 times, leading to dry eyes. Keep screens clean and maintain 15–20 degrees downward viewing angle.',
    edu_screentime_title: '4. Screen-Time & Ergonomics',
    edu_screentime_desc: 'Match ambient room brightness to screen brightness. Avoid using mobile screens in a completely pitch-black bedroom. Position displays approximately 50 to 60 cm away.',
    edu_nutrition_title: '5. Balanced Nutrition for Eyes',
    edu_nutrition_desc: 'Incorporate foods rich in Vitamin A (carrots, sweet potatoes), Lutein & Zeaxanthin (spinach, kale), and Omega-3 fatty acids (walnuts, flaxseed) to support retinal health.',
    edu_consult_title: '6. When to Consult a Professional',
    edu_consult_desc: 'Seek urgent professional eye care if you experience: sudden loss or dimming of vision, flashes of light, sudden floaters, persistent ocular pain, or double vision.',
    btn_back_dashboard: 'Back to Results',
    btn_return_home: 'Return to Home',
    modal_restart_title: 'Restart Eye Screening?',
    modal_restart_msg: 'Are you sure you want to restart? Your current session progress and recorded answers will be reset.',
    btn_cancel: 'Cancel',
    btn_confirm_restart: 'Yes, Restart',
    modal_eye_switch_title: 'Switch Eye: Cover Right Eye (OD)',
    modal_eye_switch_sub: 'Monocular Protocol • Clinical Pause',
    btn_proceed_left_eye: 'I Have Covered My Right Eye • Begin Left Eye Test'
  },

  te: {
    nav_tagline: 'డిజిటల్ దృష్టి పరీక్ష',
    voice_label: 'వాయిస్ సిద్ధం',
    disclaimer_title: 'వైద్య హెచ్చరిక:',
    disclaimer_text: 'TEST YOUR EYES అనేది ఒక ప్రాథమిక నేత్ర పరీక్షా సాధనం. ఇది వైద్యుల పరీక్షకు లేదా చికిత్సకు ప్రత్యామ్నాయం కాదు.',
    step_language: 'భాష',
    step_instructions: 'సూచనలు',
    step_tumbling: 'టంబ్లింగ్ E',
    step_alphabet: 'అక్షరాల పరీక్ష',
    step_colour: 'రంగుల పరీక్ష',
    step_results: 'ఫలితాలు',
    hero_badge: 'క్లినికల్ స్క్రీనింగ్ టెక్నాలజీ • వాయిస్ అసిస్టెన్స్',
    hero_title_main: 'మీ కళ్లను పరీక్షించుకోండి',
    hero_title_sub: 'మీ చూపును కాపాడుకోండి',
    hero_title_tagline: 'మీ చూపును కాపాడుకోండి, పరీక్షించండి',
    hero_desc: 'అధునాతన బహుభాషా డిజిటల్ నేత్ర పరీక్షా వేదిక. టంబ్లింగ్ E మరియు స్నెల్లెన్ అక్షరాల పరీక్షల ద్వారా మీ దృష్టి సామర్థ్యాన్ని సులభంగా పరీక్షించుకోండి.',
    btn_start_screening: 'కంటి పరీక్షను ప్రారంభించండి',
    btn_learn_more: 'కంటి సంరక్షణ తెలుసుకోండి',
    feat_multilingual_title: '4 ప్రాంతీయ భాషలు',
    feat_multilingual_desc: 'ఇంగ్లీష్, తెలుగు, హిందీ, తమిళం',
    feat_voice_title: 'వాయిస్ అసిస్టెన్స్',
    feat_voice_desc: 'ఆడియో సూచనలు మరియు ఆదేశాలు',
    feat_report_title: 'తక్షణ నివేదిక',
    feat_report_desc: 'సమగ్ర నివేదికను ప్రింట్ చేయండి',
    feat_header_sub: 'పరీక్షా విభాగాలు',
    feat_header_title: 'స్క్రీనింగ్ సామర్థ్యాలు',
    feat_header_desc: 'శాస్త్రీయ పద్ధతిలో రూపొందించబడిన ప్రాథమిక దృష్టి పరీక్షలు.',
    card_tumbling_title: 'టంబ్లింగ్ E పరీక్ష',
    card_tumbling_desc: 'E అక్షరం ఏ దిశలో (పైకి, క్రిందికి, ఎడమ, కుడి) తిరిగి ఉందో గుర్తించండి.',
    card_tumbling_meta: 'కుడి మరియు ఎడమ కంటికి విడివిడిగా',
    card_alphabet_title: 'స్నెల్లెన్ అక్షరాల పరీక్ష',
    card_alphabet_desc: 'స్క్రీన్‌పై కనిపించే అక్షరాలను గుర్తించి సమాధానాన్ని ఎంచుకోండి లేదా మాట్లాడండి.',
    card_alphabet_meta: 'వాయిస్ & ట్యాప్ సదుపాయం',
    card_colour_title: 'రంగుల దృష్టి పరీక్ష',
    card_colour_desc: 'డిజిటల్ ప్లేట్లలో దాగి ఉన్న సంఖ్యలను గుర్తించి వర్ణాంధత్వాన్ని పరీక్షించండి.',
    card_colour_meta: 'రంగుల విచక్షణ',
    card_voice_title: 'వాయిస్ సహాయక పరీక్ష',
    card_voice_desc: 'తెలుగు, హిందీ, తమిళం మరియు ఆంగ్లంలో పూర్తి వాయిస్ మార్గదర్శకత్వం. మీ సమాధానాలను మాట్లాడండి లేదా బటన్లను నొక్కండి.',
    card_voice_meta: 'బహుభాషా వాయిస్ AI',
    btn_listen_results: 'నివేదిక వినండి',
    btn_listen_precautions: 'జాగ్రత్తలు వినండి',
    btn_stop_audio: 'ఆడియో ఆపండి',
    lang_badge: 'దశ 1',
    lang_title: 'మీ భాషను ఎంచుకోండి',
    lang_subtitle: 'సూచనలు మరియు ఆడియో సమాచారం మీ ఎంపిక చేసుకున్న భాషలో ఉంటాయి.',
    btn_back: 'వెనుకకు',
    btn_confirm_lang: 'ధృవీకరించండి & కొనసాగండి',
    inst_badge: 'ముఖ్యమైన సూచనలు',
    inst_title: 'పరీక్షకు ఎలా సిద్ధం కావాలి?',
    inst_subtitle: 'సరైన ఫలితాల కొరకు ఈ మార్గదర్శకాలను పాటించండి.',
    inst_step1_tag: 'దశ 1: దూరం',
    inst_step1_title: 'చేతి దూరం పాటించండి',
    inst_step1_desc: 'మీ లాప్‌టాప్ లేదా స్క్రీన్ నుండి సుమారు 40 నుండి 50 సెం.మీ దూరం కూర్చోండి.',
    inst_step1_tip: 'పరీక్ష సమయంలో ముందుకు వంగకండి.',
    inst_step2_tag: 'దశ 2: వెలుతురు',
    inst_step2_title: 'సహజమైన వెలుతురు',
    inst_step2_desc: 'గదిలో సమానమైన వెలుతురు ఉండేలా చూసుకోండి. స్క్రీన్‌పై ప్రత్యక్ష కాంతి పడకుండా చూసుకోండి.',
    inst_step2_tip: 'రంగుల స్పష్టత కోసం నైట్ లైట్ ఫిల్టర్‌ను ఆపివేయండి.',
    inst_step3_tag: 'దశ 3: కన్ను మూయడం',
    inst_step3_title: 'ఒత్తిడి లేకుండా మూయండి',
    inst_step3_desc: 'మీ అరచేతిని కంటిపై సున్నితంగా ఉంచండి. కనుగుడ్డును గట్టిగా నొక్కవద్దు.',
    inst_step3_tip: 'చేతి వెనుక రెండు కళ్లను తెరిచి ఉంచండి.',
    inst_step4_tag: 'దశ 4: విడివిడిగా పరీక్ష',
    inst_step4_title: 'రెండు కళ్లను విడిగా ఎందుకు?',
    inst_step4_desc: 'మెదడు బలమైన కంటి సహాయంతో సరిచేస్తుంది. విడివిడిగా పరీక్షించడం ద్వారా ప్రతి కంటి చూపు తెలుస్తుంది.',
    inst_step4_tip: 'ముందుగా కుడి కన్ను (OD), తర్వాత ఎడమ కన్ను (OS) పరీక్షిస్తాము.',
    btn_read_instructions: 'సూచనలను వినండి (ఆడియో)',
    voice_input_ready_chip: 'వాయిస్ ఆదేశాలు సిద్ధం',
    btn_start_tumbling: 'టంబ్లింగ్ E పరీక్ష ప్రారంభించండి',
    acuity_level_label: 'దృష్టి స్థాయి:',
    dir_up: 'పైకి',
    dir_down: 'క్రిందికి',
    dir_left: 'ఎడమ',
    dir_right: 'కుడి',
    btn_cant_see: 'నాకు స్పష్టంగా కనిపించడం లేదు',
    btn_repeat_instruction: 'సూచనను మళ్లీ వినిపించండి',
    btn_restart_test: 'పరీక్షను పునఃప్రారంభించండి',
    choose_letter_label: 'సరిపోలే అక్షరాన్ని ఎంచుకోండి:',
    tab_colour_vision: 'రంగుల దృష్టి పరీక్ష',
    tab_optional_tests: 'ఐచ్ఛిక పరీక్షలు',
    plate_label: 'ప్లేట్',
    plate_accuracy_note: 'వర్ణాంధత్వ స్క్రీనింగ్ కోసం రూపొందించిన డిజిటల్ సిమ్యులేషన్.',
    colour_question_title: 'వృత్తంలో మీకు ఏ సంఖ్య కనిపిస్తోంది?',
    colour_question_desc: 'చుక్కలను 3-5 సెకన్లు పరిశీలించి సంఖ్యను ఎంచుకోండి:',
    btn_nothing_visible: 'ఏమీ కనిపించడం లేదు',
    optional_intro_title: 'ప్రత్యేక ఐచ్ఛిక పరీక్షలు',
    optional_intro_desc: 'రెటీనా మరియు కాంట్రాస్ట్ స్పష్టతను మరింత లోతుగా పరీక్షించడానికి వీటిని ఉపయోగించండి.',
    btn_skip_to_results: 'దాటవేసి ఫలితాలు చూడండి',
    btn_proceed_results: 'ఫలితాల నివేదికను రూపొందించండి',
    res_screening_complete: 'ప్రాథమిక పరీక్ష పూర్తయింది',
    res_dashboard_title: 'మీ దృష్టి పరీక్షా నివేదిక',
    res_overall_rating: 'మొత్తం పనితీరు',
    btn_print_report: 'నివేదికను ప్రింట్ చేయండి',
    btn_view_report: 'సారాంశం చూడండి',
    btn_restart_screening: 'కొత్త స్క్రీనింగ్ ప్రారంభించండి',
    btn_go_to_learn: '20-20-20 నియమం & సంరక్షణ',
    learn_badge: 'కంటి ఆరోగ్యం & అవగాహన',
    learn_title: 'కంటి సంరక్షణ మరియు జాగ్రత్తలు',
    learn_subtitle: 'డిజిటల్ అలసటను తగ్గించే పద్ధతులు మరియు ఆరోగ్యకరమైన అలవాట్లు.',
    audio_explainer_title: 'ఆడియో వివరణ వినండి',
    audio_explainer_desc: 'మీ పరీక్ష ఫలితాలు మరియు కంటి సంరక్షణ సలహాలు మీ భాషలో వినండి.',
    audio_ready_status: 'ఆడియో సిద్ధంగా ఉంది',
    timer_title: 'ఇంటరాక్టివ్ 20-20-20 నియమం టైమర్',
    timer_desc: 'ప్రతి 20 నిమిషాలకు, 20 అడుగుల దూరంలో ఉన్న వస్తువును 20 సెకన్ల పాటు చూడండి.',
    edu_acuity_title: '1. పరీక్ష ఫలితాలను అర్థం చేసుకోవడం',
    edu_acuity_desc: '20/20 అంటే సాధారణ దృష్టి. 20/40 అంటే సాధారణ వ్యక్తి 40 అడుగుల దూరం నుండి చూడగలిగేది మీరు 20 అడుగుల నుండి మాత్రమే చూడగలరు.',
    edu_refractive_title: '2. సాధారణ దృష్టి సమస్యలు',
    edu_refractive_desc: 'మయోపియా (దూరపు చూపు మందగించడం), హైపరోపియా (దగ్గరి చూపు సమస్య), ఆస్టిగ్మాటిజం మరియు ప్రెస్బియోపియా.',
    edu_habits_title: '3. రోజువారీ కంటి అలవాట్లు',
    edu_habits_desc: 'తరచుగా కనురెప్పలు ఆర్పండి. డిజిటల్ స్క్రీన్లు చూసేటప్పుడు రెప్పలార్పడం తగ్గుతుంది, ఇది కంటి పొడిబారడానికి దారితీస్తుంది.',
    edu_screentime_title: '4. స్క్రీన్ సమయం మరియు భంగిమ',
    edu_screentime_desc: 'చీకటి గదిలో మొబైల్ వాడవద్దు. స్క్రీన్ వెలుతురును గది వెలుతురుకు అనుగుణంగా సర్దుబాటు చేయండి.',
    edu_nutrition_title: '5. కంటికి బలవర్ధక ఆహారం',
    edu_nutrition_desc: 'విటమిన్ ఏ (క్యారెట్లు), ల్యూటిన్ (పాలకూర) మరియు ఒమేగా-3 కొవ్వు ఆమ్లాలు కంటి ఆరోగ్యానికి మేలు చేస్తాయి.',
    edu_consult_title: '6. వైద్యుడిని ఎప్పుడు సంప్రదించాలి?',
    edu_consult_desc: 'చూపు అకస్మాత్తుగా తగ్గడం, కంటి నొప్పి, వెలుగు చారలు లేదా నల్లటి మచ్చలు కనిపిస్తే వెంటనే నేత్ర వైద్యుడిని సంప్రదించండి.',
    btn_back_dashboard: 'ఫలితాలకు వెళ్లండి',
    btn_return_home: 'హోమ్‌కు తిరిగి వెళ్లండి',
    modal_restart_title: 'పరీక్షను పునఃప్రారంభించాలా?',
    modal_restart_msg: 'మీరు నిజంగా పునఃప్రారంభించాలనుకుంటున్నారా? ప్రస్తుత సమాధానాలు తొలగించబడతాయి.',
    btn_cancel: 'రద్దు చేయి',
    btn_confirm_restart: 'అవును, పునఃప్రారంభించు',
    modal_eye_switch_title: 'కంటిని మార్చండి: కుడి కన్ను (OD) మూయండి',
    modal_eye_switch_sub: 'మోనోక్యులర్ ప్రోటోకాల్ • చిన్న విరామం',
    btn_proceed_left_eye: 'నేను కుడి కన్ను మూసాను • ఎడమ కంటి పరీక్ష ప్రారంభించండి'
  },

  hi: {
    nav_tagline: 'डिजिटल दृष्टि परीक्षण',
    voice_label: 'आवाज़ तैयार',
    disclaimer_title: 'चिकित्सा अस्वीकरण:',
    disclaimer_text: 'TEST YOUR EYES एक प्रारंभिक शैक्षिक नेत्र परीक्षण उपकरण है। यह पेशेवर नेत्र परीक्षण का विकल्प नहीं है और किसी रोग का निदान नहीं करता।',
    step_language: 'भाषा',
    step_instructions: 'निर्देश',
    step_tumbling: 'टम्बलिंग E',
    step_alphabet: 'अक्षर परीक्षण',
    step_colour: 'रंग दृष्टि',
    step_results: 'परिणाम',
    hero_badge: 'क्लिनिकल स्क्रीनिंग तकनीक • वॉइस-असिस्टेड',
    hero_title_main: 'अपनी आंखों की जांच करें',
    hero_title_sub: 'अपनी दृष्टि सुरक्षित रखें',
    hero_title_tagline: 'अपनी आंखें बचाएं, अपनी दृष्टि जांचें',
    hero_desc: 'एक सुलभ, बहुभाषी डिजिटल नेत्र परीक्षण प्रणाली। टम्बलिंग E और स्नेलेन परीक्षणों के साथ अपनी दृष्टि का आकलन करें और तुरंत रिपोर्ट प्राप्त करें।',
    btn_start_screening: 'नेत्र परीक्षण शुरू करें',
    btn_learn_more: 'नेत्र देखभाल सीखें',
    feat_multilingual_title: '4 क्षेत्रीय भाषाएं',
    feat_multilingual_desc: 'अंग्रेजी, तेलुगु, हिंदी, तमिल',
    feat_voice_title: 'आवाज़ सहायता',
    feat_voice_desc: 'ऑडियो निर्देश और वॉइस कमांड',
    feat_report_title: 'तुरंत परिणाम रिपोर्ट',
    feat_report_desc: 'विस्तृत रिपोर्ट देखें और प्रिंट करें',
    feat_header_sub: 'परीक्षण क्षमताएं',
    feat_header_title: 'वैज्ञानिक दृष्टि जांच',
    feat_header_desc: 'मानकीकृत और सहज डिजिटल नेत्र परीक्षण विधियां।',
    card_tumbling_title: 'टम्बलिंग E परीक्षण',
    card_tumbling_desc: 'अक्षर E किस दिशा (ऊपर, नीचे, बाएं, दाएं) में खुला है, उसे पहचानें।',
    card_tumbling_meta: 'दोनों आंखों का अलग-अलग परीक्षण',
    card_alphabet_title: 'स्नेलेन वर्णमाला परीक्षण',
    card_alphabet_desc: 'स्क्रीन पर प्रदर्शित अक्षरों को पहचानें और बटन दबाकर या बोलकर उत्तर दें।',
    card_alphabet_meta: 'वॉइस और टच समर्थित',
    card_colour_title: 'रंग दृष्टि परीक्षण',
    card_colour_desc: 'डिजिटल प्लेटों में छिपे नंबरों को पहचानकर वर्णांधता की जांच करें।',
    card_colour_meta: 'सूडोइसोक्रोमैटिक प्लेट्स',
    card_voice_title: 'आवाज़-सहायक जांच',
    card_voice_desc: 'हिंदी, तेलुगु, तमिल और अंग्रेजी में संपूर्ण वॉइस मार्गदर्शन। अपने उत्तर बोलें या स्क्रीन पर टैप करें।',
    card_voice_meta: 'बहुभाषी वॉइस AI',
    btn_listen_results: 'रिपोर्ट सुनें',
    btn_listen_precautions: 'सावधानियां सुनें',
    btn_stop_audio: 'ऑडियो रोकें',
    lang_badge: 'चरण 1',
    lang_title: 'अपनी पसंदीदा भाषा चुनें',
    lang_subtitle: 'सभी निर्देश, ऑडियो और रिपोर्ट आपकी चुनी हुई भाषा में प्रदर्शित होंगे।',
    btn_back: 'वापस',
    btn_confirm_lang: 'पुष्टि करें और आगे बढ़ें',
    inst_badge: 'तैयारी के नियम',
    inst_title: 'सटीक जांच के लिए निर्देश',
    inst_subtitle: 'विश्वसनीय परिणामों के लिए इन चिकित्सकीय दिशानिर्देशों का पालन करें।',
    inst_step1_tag: 'चरण 1: दूरी',
    inst_step1_title: 'हाथ भर की दूरी बनाए रखें',
    inst_step1_desc: 'स्क्रीन से लगभग 40 से 50 सेंटीमीटर की दूरी पर आराम से बैठें।',
    inst_step1_tip: 'परीक्षण के दौरान आगे न झुकें।',
    inst_step2_tag: 'चरण 2: प्रकाश',
    inst_step2_title: 'उचित प्रकाश व्यवस्था',
    inst_step2_desc: 'कमरे में एक समान रोशनी हो और स्क्रीन पर कोई सीधी चमक या प्रतिबिंब न पड़े।',
    inst_step2_tip: 'रंगों की स्पष्टता के लिए नाइट लाइट फ़िल्टर बंद रखें।',
    inst_step3_tag: 'चरण 3: आंख ढकना',
    inst_step3_title: 'दबाए बिना ढकें',
    inst_step3_desc: 'अपनी हथेली से एक आंख को हल्के से ढकें। पुतली पर कोई दबाव न डालें।',
    inst_step3_tip: 'हथेली के पीछे दोनों आंखें खुली रखें।',
    inst_step4_tag: 'चरण 4: अलग-अलग जांच',
    inst_step4_title: 'प्रत्येक आंख की अलग जांच क्यों?',
    inst_step4_desc: 'मस्तिष्क मजबूत आंख से कमजोर आंख की भरपाई करता है। अलग जांच से सही स्थिति सामने आती है।',
    inst_step4_tip: 'पहले दाईं आंख (OD), फिर बाईं आंख (OS) का परीक्षण होगा।',
    btn_read_instructions: 'निर्देश सुनें (ऑडियो)',
    voice_input_ready_chip: 'वॉइस कमांड तैयार',
    btn_start_tumbling: 'टम्बलिंग E परीक्षण शुरू करें',
    acuity_level_label: 'दृष्टि स्तर:',
    dir_up: 'ऊपर',
    dir_down: 'नीचे',
    dir_left: 'बाएं',
    dir_right: 'दाएं',
    btn_cant_see: 'मुझे स्पष्ट दिखाई नहीं दे रहा',
    btn_repeat_instruction: 'ऑडियो निर्देश दोबारा सुनें',
    btn_restart_test: 'परीक्षण पुनरारंभ करें',
    choose_letter_label: 'सही अक्षर चुनें:',
    tab_colour_vision: 'रंग दृष्टि परीक्षण',
    tab_optional_tests: 'वैकल्पिक परीक्षण',
    plate_label: 'प्लेट',
    plate_accuracy_note: 'लाल-हरे रंग की पहचान के लिए डिजिटल सिमुलेशन।',
    colour_question_title: 'आपको वृत्त में कौन सी संख्या दिखाई दे रही है?',
    colour_question_desc: '3-5 सेकंड बिंदुओं को देखें और संख्या चुनें:',
    btn_nothing_visible: 'कुछ भी दिखाई नहीं दे रहा',
    optional_intro_title: 'विशेष वैकल्पिक परीक्षण',
    optional_intro_desc: 'रेटिना और कंट्रास्ट की विस्तृत जांच के लिए इन परीक्षणों का चयन करें।',
    btn_skip_to_results: 'छोड़ें और परिणाम देखें',
    btn_proceed_results: 'परीक्षण पूरा करें और रिपोर्ट बनाएं',
    res_screening_complete: 'प्रारंभिक जांच पूरी हुई',
    res_dashboard_title: 'आपकी डिजिटल दृष्टि रिपोर्ट',
    res_overall_rating: 'समग्र प्रदर्शन',
    btn_print_report: 'आधिकारिक रिपोर्ट प्रिंट करें',
    btn_view_report: 'सारांश देखें',
    btn_restart_screening: 'नई जांच शुरू करें',
    btn_go_to_learn: '20-20-20 नियम और देखभाल',
    learn_badge: 'नेत्र स्वास्थ्य शिक्षा',
    learn_title: 'अपनी दृष्टि को समझें और देखभाल करें',
    learn_subtitle: 'डिजिटल स्क्रीन स्ट्रेन से बचाव और स्वस्थ आंखों के नियम।',
    audio_explainer_title: 'ऑडियो स्पष्टीकरण सुनें',
    audio_explainer_desc: 'अपनी भाषा में अपनी दृष्टि रिपोर्ट और सावधानियों का ऑडियो सारांश सुनें।',
    audio_ready_status: 'ऑडियो सारांश तैयार है',
    timer_title: 'इंटरएक्टिव 20-20-20 नियम टाइमर',
    timer_desc: 'प्रत्येक 20 मिनट बाद, 20 फीट दूर किसी वस्तु को 20 सेकंड के लिए देखें।',
    edu_acuity_title: '1. परिणामों को समझना',
    edu_acuity_desc: '20/20 सामान्य दृष्टि है। 20/40 का अर्थ है कि जिसे सामान्य आंख 40 फीट से देख सकती है, उसे देखने के लिए आपको 20 फीट पास होना पड़ता है।',
    edu_refractive_title: '2. सामान्य दृष्टि दोष',
    edu_refractive_desc: 'मायोपिया (निकट दृष्टि दोष), हाइपरोपिया (दूर दृष्टि दोष), दृष्टिवैषम्य (एस्टिग्मैटिज्म) और प्रेसबायोपिया।',
    edu_habits_title: '3. दैनिक स्वस्थ आदतें',
    edu_habits_desc: 'स्क्रीन पर काम करते समय पलकें बार-बार झपकाएं। स्क्रीन को हमेशा आंखों के स्तर से 15-20 डिग्री नीचे रखें।',
    edu_screentime_title: '4. स्क्रीन समय की सावधानियां',
    edu_screentime_desc: 'अंधेरे कमरे में फोन न चलाएं। स्क्रीन की चमक को कमरे की रोशनी के अनुसार रखें।',
    edu_nutrition_title: '5. आंखों के लिए संतुलित पोषण',
    edu_nutrition_desc: 'विटामिन ए (गाजर), ल्यूटिन (पालक) और ओमेगा-3 फैटी एसिड रेटिना को स्वस्थ रखते हैं।',
    edu_consult_title: '6. डॉक्टर से कब परामर्श लें?',
    edu_consult_desc: 'यदि अचानक दृष्टि कम हो, आंखों में तेज दर्द हो, या रोशनी के छल्ले दिखें, तो तुरंत नेत्र विशेषज्ञ से संपर्क करें।',
    btn_back_dashboard: 'परिणामों पर वापस जाएं',
    btn_return_home: 'होम पर वापस जाएं',
    modal_restart_title: 'क्या आप पुनः प्रारंभ करना चाहते हैं?',
    modal_restart_msg: 'क्या आप निश्चित हैं? वर्तमान सत्र की प्रगति और उत्तर रीसेट हो जाएंगे।',
    btn_cancel: 'रद्द करें',
    btn_confirm_restart: 'हां, पुनः प्रारंभ करें',
    modal_eye_switch_title: 'आंख बदलें: दाईं आंख (OD) को ढकें',
    modal_eye_switch_sub: 'मोनोकुलर प्रोटोकॉल • संक्षिप्त विराम',
    btn_proceed_left_eye: 'मैंने दाईं आंख ढक ली है • बाईं आंख की जांच शुरू करें'
  },

  ta: {
    nav_tagline: 'டிஜிட்டல் பார்வை பரிசோதனை',
    voice_label: 'குரல் தயார்',
    disclaimer_title: 'மருத்துவ மறுப்பு:',
    disclaimer_text: 'TEST YOUR EYES என்பது ஒரு ஆரம்ப பார்வை பரிசோதனை கருவி. இது தொழில்முறை மருத்துவ பரிசோதனைக்கு மாற்றாகாது.',
    step_language: 'மொழி',
    step_instructions: 'வழிமுறைகள்',
    step_tumbling: 'டம்பிளிங் E',
    step_alphabet: 'எழுத்து தேர்வு',
    step_colour: 'வண்ண பார்வை',
    step_results: 'முடிவுகள்',
    hero_badge: 'மருத்துவ பரிசோதனை தொழில்நுட்பம் • குரல் உதவி',
    hero_title_main: 'உங்கள் கண்களை பரிசோதிக்கவும்',
    hero_title_sub: 'பார்வையை பாதுகாக்கவும்',
    hero_title_tagline: 'உங்கள் பார்வையை பாதுகாக்கவும், பரிசோதிக்கவும்',
    hero_desc: 'நவீன பன்மொழி டிஜிட்டல் பார்வை பரிசோதனை தளம். டம்பிளிங் E மற்றும் ஸ்னெல்லன் சோதனைகள் மூலம் உங்கள் கண்பார்வையை எளிதாக கண்டறியுங்கள்.',
    btn_start_screening: 'பரிசோதனையை தொடங்கவும்',
    btn_learn_more: 'கண் பராமரிப்பை அறியவும்',
    feat_multilingual_title: '4 பிராந்திய மொழிகள்',
    feat_multilingual_desc: 'ஆங்கிலம், தெலுங்கு, இந்தி, தமிழ்',
    feat_voice_title: 'குரல் வழி வழிகாட்டுதல்',
    feat_voice_desc: 'ஆடியோ வழிமுறைகள் மற்றும் குரல் கட்டளைகள்',
    feat_report_title: 'உடனடி அறிக்கை',
    feat_report_desc: 'முழுமையான அறிக்கையை அச்சிடலாம்',
    feat_header_sub: 'பரிசோதனை தொகுப்பு',
    feat_header_title: 'பார்வை பரிசோதனை திறன்கள்',
    feat_header_desc: 'அறிவியல் பூர்வமாக வடிவமைக்கப்பட்ட ஆரம்ப பார்வை சோதனைகள்.',
    card_tumbling_title: 'டம்பிளிங் E சோதனை',
    card_tumbling_desc: 'E எழுத்து எந்த திசையில் (மேலே, கீழே, இடது, வலது) திரும்பியுள்ளது என்பதை கண்டறியவும்.',
    card_tumbling_meta: 'வலது மற்றும் இடது கண் தனித்தனியாக',
    card_alphabet_title: 'ஸ்னெல்லன் எழுத்துக்கள் சோதனை',
    card_alphabet_desc: 'திரையில் தோன்றும் எழுத்துக்களை குரல் மூலமாகவோ அல்லது பட்டன்களை அழுத்தியோ அடையாளம் காணவும்.',
    card_alphabet_meta: 'குரல் மற்றும் தொடுதல் வசதி',
    card_colour_title: 'வண்ண பார்வை தட்டுகள்',
    card_colour_desc: 'வண்ண தட்டுகளில் மறைந்துள்ள எண்களை கண்டறிந்து நிறக்குருடு உள்ளதா என சோதிக்கவும்.',
    card_colour_meta: 'நிற பாகுபாடு சோதனை',
    card_voice_title: 'குரல் வழி பரிசோதனை',
    card_voice_desc: 'தமிழ், தெலுங்கு, இந்தி மற்றும் ஆங்கிலத்தில் முழுமையான குரல் வழிகாட்டுதல். விடைகளை பேசலாம் அல்லது தொடலாம்.',
    card_voice_meta: 'பன்மொழி குரல் AI',
    btn_listen_results: 'அறிக்கையைக் கேளுங்கள்',
    btn_listen_precautions: 'முன்னெச்சரிக்கைகளைக் கேளுங்கள்',
    btn_stop_audio: 'ஆடியோவை நிறுத்துங்கள்',
    lang_badge: 'படி 1',
    lang_title: 'உங்கள் விருப்ப மொழியை தேர்ந்தெடுக்கவும்',
    lang_subtitle: 'அனைத்து வழிமுறைகளும் அறிக்கையும் நீங்கள் தேர்ந்தெடுத்த மொழியில் வழங்கப்படும்.',
    btn_back: 'பின்செல்க',
    btn_confirm_lang: 'உறுதிசெய்து தொடரவும்',
    inst_badge: 'அத்தியாவசிய தயாரிப்பு',
    inst_title: 'துல்லியமான பரிசோதனைக்கு எவ்வாறு தயாராவது?',
    inst_subtitle: 'சரியான முடிவுகளுக்கு இந்த மருத்துவ வழிகாட்டுதல்களைப் பின்பற்றவும்.',
    inst_step1_tag: 'படி 1: தூரம்',
    inst_step1_title: 'கை நீள தூரம் இருக்கவும்',
    inst_step1_desc: 'திரையிலிருந்து சுமார் 40 முதல் 50 செ.மீ தூரத்தில் வசதியாக அமரவும்.',
    inst_step1_tip: 'பரிசோதனையின் போது முன்னோக்கி சாயாதீர்கள்.',
    inst_step2_tag: 'படி 2: வெளிச்சம்',
    inst_step2_title: 'சரியான சமச்சீர் வெளிச்சம்',
    inst_step2_desc: 'அறையில் சீரான வெளிச்சம் இருப்பதை உறுதிப்படுத்தவும். திரையில் ஒளி பிரதிபலிக்காமல் பார்த்துக்கொள்ளவும்.',
    inst_step2_tip: 'வண்ண தெளிவுக்காக நைட் மோடை அணைக்கவும்.',
    inst_step3_tag: 'படி 3: கண்ணை மூடுதல்',
    inst_step3_title: 'அழுத்தாமல் மூடவும்',
    inst_step3_desc: 'உங்கள் உள்ளங்கையால் ஒரு கண்ணை மெதுவாக மூடவும். கண்ணில் எந்த அழுத்தமும் கொடுக்கக்கூடாது.',
    inst_step3_tip: 'இரண்டு கண்களையும் திறந்து வைத்திருக்கவும்.',
    inst_step4_tag: 'படி 4: தனித்தனி சோதனை',
    inst_step4_title: 'ஒவ்வொரு கண்ணையும் ஏன் தனித்தனியாக?',
    inst_step4_desc: 'மூளை வலுவான கண்ணைப் பயன்படுத்தி பார்வை குறைபாட்டை மறைக்கக்கூடும். தனித்தனியாக சோதிப்பதே சிறந்தது.',
    inst_step4_tip: 'முதலில் வலது கண் (OD), பின்னர் இடது கண் (OS) சோதிக்கப்படும்.',
    btn_read_instructions: 'வழிமுறைகளை கேளுங்கள் (ஆடியோ)',
    voice_input_ready_chip: 'குரல் கட்டளைகள் தயார்',
    btn_start_tumbling: 'டம்பிளிங் E சோதனையை தொடங்கவும்',
    acuity_level_label: 'பார்வை நிலை:',
    dir_up: 'மேலே',
    dir_down: 'கீழே',
    dir_left: 'இடது',
    dir_right: 'வலது',
    btn_cant_see: 'எனக்கு தெளிவாக தெரியவில்லை',
    btn_repeat_instruction: 'ஆடியோவை மீண்டும் கேட்கவும்',
    btn_restart_test: 'சோதனையை மீண்டும் தொடங்கவும்',
    choose_letter_label: 'பொருத்தமான எழுத்தை தேர்வு செய்யவும்:',
    tab_colour_vision: 'வண்ண பார்வை சோதனை',
    tab_optional_tests: 'கூடுதல் விருப்ப சோதனைகள்',
    plate_label: 'தட்டு',
    plate_accuracy_note: 'சிவப்பு-பச்சை நிறங்களை கண்டறியும் டிஜிட்டல் பரிசோதனை.',
    colour_question_title: 'வட்டத்தில் உங்களுக்கு என்ன எண் தெரிகிறது?',
    colour_question_desc: '3-5 வினாடிகள் பார்த்து சரியான எண்ணை தேர்வு செய்யவும்:',
    btn_nothing_visible: 'எதுவும் தெரியவில்லை',
    optional_intro_title: 'கூடுதல் சிறப்பு சோதனைகள்',
    optional_intro_desc: 'மாகுலர் சிதைவு மற்றும் பார்வை விழிப்புணர்வை சோதிக்க விருப்ப சோதனைகளை தேர்வு செய்யலாம்.',
    btn_skip_to_results: 'தவிர்த்து முடிவுகளை பார்க்கவும்',
    btn_proceed_results: 'முடிவு அறிக்கையை உருவாக்கவும்',
    res_screening_complete: 'ஆரம்ப பரிசோதனை முடிந்தது',
    res_dashboard_title: 'உங்கள் பார்வை பரிசோதனை அறிக்கை',
    res_overall_rating: 'ஒட்டுமொத்த செயல்பாடு',
    btn_print_report: 'அறிக்கையை அச்சிடவும்',
    btn_view_report: 'சுருக்கத்தை காண்க',
    btn_restart_screening: 'புதிய பரிசோதனையை தொடங்கவும்',
    btn_go_to_learn: '20-20-20 விதி மற்றும் பாதுகாப்பு',
    learn_badge: 'கண் ஆரோக்கிய விழிப்புணர்வு',
    learn_title: 'கண் பராமரிப்பும் முன்னெச்சரிக்கைகளும்',
    learn_subtitle: 'டிஜிட்டல் கண் சோர்வை தடுக்கும் வழிமுறைகள்.',
    audio_explainer_title: 'ஆடியோ விளக்கத்தை கேளுங்கள்',
    audio_explainer_desc: 'உங்கள் பார்வை முடிவுகள் மற்றும் பாதுகாப்பு வழிமுறைகளின் ஆடியோ விளக்கம்.',
    audio_ready_status: 'ஆடியோ விளக்கம் தயார்',
    timer_title: '20-20-20 விதி டைமர்',
    timer_desc: 'ஒவ்வொரு 20 நிமிடங்களுக்கும், 20 அடி தூரத்தில் உள்ள ஒரு பொருளை 20 வினாடிகள் பார்க்கவும்.',
    edu_acuity_title: '1. பார்வை முடிவுகளை புரிந்துகொள்ளுதல்',
    edu_acuity_desc: '20/20 என்பது இயல்பான பார்வை. 20/40 என்றால் இயல்பான மனிதர் 40 அடியில் காண்பதை நீங்கள் 20 அடியில் மட்டுமே காண முடியும்.',
    edu_refractive_title: '2. பொதுவான பார்வை குறைபாடுகள்',
    edu_refractive_desc: 'மயோபியா (கிட்டப்பார்வை), ஹைபரோபியா (தூரப்பார்வை), அஸ்டிஜிமாடிசம் மற்றும் ப்ரெஸ்பயோபியா.',
    edu_habits_title: '3. அன்றாட கண் பழக்கங்கள்',
    edu_habits_desc: 'அடிக்கடி இமைகளை சிமிட்டுங்கள். கணினி திரையை பார்க்கும்போது சிமிட்டும் அளவு குறைந்து கண்கள் வறண்டு போகும்.',
    edu_screentime_title: '4. திரை நேர முன்னெச்சரிக்கைகள்',
    edu_screentime_desc: 'முழு இருட்டில் மொபைல் பார்க்காதீர்கள். அறையின் வெளிச்சத்திற்கு ஏற்ப திரை வெளிச்சத்தை வைக்கவும்.',
    edu_nutrition_title: '5. கண்களுக்கு ஆரோக்கியமான உணவு',
    edu_nutrition_desc: 'வைட்டமின் ஏ (கேரட்), லுடீன் (கீரைகள்) மற்றும் ஒமேகா-3 விழித்திரையை பாதுகாக்க உதவுகின்றன.',
    edu_consult_title: '6. மருத்துவரை எப்போது அணுக வேண்டும்?',
    edu_consult_desc: 'திடீர் பார்வை மங்கல், கடுமையான கண் வலி, ஒளிக்கீற்றுகள் தோன்றினால் உடனடியாக கண் மருத்துவரை அணுகவும்.',
    btn_back_dashboard: 'முடிவுகளுக்கு திரும்புக',
    btn_return_home: 'முகப்பிற்கு செல்க',
    modal_restart_title: 'மீண்டும் தொடங்கவா?',
    modal_restart_msg: 'நிச்சயமாக நீங்கள் மீண்டும் தொடங்க விரும்புகிறீர்களா? தற்போதைய பதில்கள் நீக்கப்படும்.',
    btn_cancel: 'ரத்து செய்',
    btn_confirm_restart: 'ஆம், மீண்டும் தொடங்கு',
    modal_eye_switch_title: 'கண்ணை மாற்றவும்: வலது கண்ணை (OD) மூடவும்',
    modal_eye_switch_sub: 'தனித்தனி பரிசோதனை விதிமுறை • சிறிய இடைவெளி',
    btn_proceed_left_eye: 'நான் வலது கண்ணை மூடிவிட்டேன் • இடது கண் பரிசோதனையைத் தொடங்குங்கள்'
  }
};

// ==========================================================================
// 3. VOICE CONFIGURATION & MULTILINGUAL SPEECH ENGINE
// ==========================================================================
const speechLanguages = {
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  en: "en-IN"
};

const voiceLanguages = {
  en: {
    speechLanguage: "en-IN",
    fallbackLanguage: "en-US",
    name: "English"
  },
  te: {
    speechLanguage: "te-IN",
    name: "Telugu"
  },
  hi: {
    speechLanguage: "hi-IN",
    name: "Hindi"
  },
  ta: {
    speechLanguage: "ta-IN",
    name: "Tamil"
  }
};

const SPOKEN_TEXTS = {
  en: {
    tumblingPrompt: (eye, dir) => `Looking with your ${eye}, which direction is the letter E pointing? Say up, down, left, right, or tap your answer.`,
    tumblingComplete: "Tumbling E screening completed. Moving to alphabet visual acuity screening.",
    alphabetPrompt: (eye) => `Looking with your ${eye}, what letter do you see? Speak the letter or tap the matching button below.`,
    alphabetComplete: "Visual acuity tests completed. Moving to colour vision screening.",
    colourPrompt: "Look at the circular plate. What number do you see in the dots? Select the number or tap nothing visible.",
    colourComplete: "Colour vision screening completed. Generating your comprehensive vision report.",
    instructions: "Sit comfortably at an arm's length distance from your screen. Make sure your room has balanced lighting. Cup your palm gently over one eye without pressing the eyeball. First, we will test your right eye.",
    precautions: "Screen-time eye care precautions: First, follow the 20-20-20 rule. Every 20 minutes, look at an object 20 feet away for 20 seconds to relax your eye muscles. Second, blink frequently to prevent dry eye strain. Third, match ambient room brightness to screen brightness. Fourth, keep displays approximately 50 to 60 centimeters away. Fifth, maintain balanced nutrition with Vitamin A and Omega-3. Sixth, consult an eye specialist if you experience persistent strain or sudden vision changes.",
    resultsReport: (odAcuity, osAcuity, colourScore) => `Your preliminary digital vision screening is complete. Visual acuity for your right eye is recorded at ${odAcuity}, and your left eye at ${osAcuity}. Colour discrimination score is ${colourScore} out of 5 plates correct. Preliminary observations indicate normal functional resolution at the tested distance. Remember that digital screening is an educational tool and does not replace a comprehensive clinical eye examination.`
  },
  te: {
    tumblingPrompt: (eye, dir) => `మీ ${eye === 'Right eye' ? 'కుడి కంటితో' : 'ఎడమ కంటితో'} చూస్తూ, E అక్షరం ఏ దిశలో ఉంది? పైకి, క్రిందికి, ఎడమ లేదా కుడి చెప్పండి లేదా బటన్ నొక్కండి.`,
    tumblingComplete: "టంబ్లింగ్ E పరీక్ష పూర్తయింది. ఇప్పుడు ఆల్ఫాబెట్ అక్యుయిటీ పరీక్ష ప్రారంభమవుతుంది.",
    alphabetPrompt: (eye) => `మీ ${eye === 'Right eye' ? 'కుడి కంటితో' : 'ఎడమ కంటితో'} చూస్తూ, తెరపై ఏ అక్షరం కనిపిస్తుంది? అక్షరాన్ని చెప్పండి లేదా క్రింది బటన్ నొక్కండి.`,
    alphabetComplete: "దృష్టి పరీక్షలు పూర్తయ్యాయి. ఇప్పుడు రంగు దృష్టి పరీక్ష ప్రారంభమవుతుంది.",
    colourPrompt: "వృత్తాకార ప్లేట్ చూడండి. చుక్కలలో ఏ సంఖ్య కనిపిస్తుంది? సంఖ్యను ఎంచుకోండి.",
    colourComplete: "రంగు దృష్టి పరీక్ష పూర్తయింది. మీ పూర్తి నివేదిక సిద్ధమవుతోంది.",
    instructions: "మీ స్క్రీన్ నుండి చేతి దూరంలో సౌకర్యవంతంగా కూర్చోండి. గదిలో సరైన వెలుతురు ఉండేలా చూసుకోండి. మీ అరచేతితో ఒక కన్నును నొక్కకుండా మూయండి. ముందుగా కుడి కన్ను పరీక్షిస్తాము.",
    precautions: "కంటి సంరక్షణ జాగ్రత్తలు: మొదటిది, 20-20-20 నియమాన్ని పాటించండి. ప్రతి 20 నిమిషాలకు, 20 అడుగుల దూరంలో ఉన్న వస్తువును 20 సెకన్ల పాటు చూడండి. రెండవది, కళ్ళు పొడిబారకుండా తరచుగా రెప్పవేయండి. మూడవది, స్క్రీన్ కాంతిని గది వెలుతురుకు తగినట్లు సర్దుబాటు చేయండి. నాల్గవది, స్క్రీన్‌ను కళ్ళ నుండి 50 నుండి 60 సెంటీమీటర్ల దూరంలో ఉంచండి. ఐదవది, విటమిన్ ఏ మరియు ఒమేగా 3 ఉన్న సమతుల్య ఆహారం తీసుకోండి. ఆరవది, కంటి నొప్పి లేదా ఆకస్మిక దృష్టి మార్పులు ఉంటే వెంటనే నేత్ర వైద్యుడిని సంప్రదించండి.",
    resultsReport: (odAcuity, osAcuity, colourScore) => `మీ ప్రాథమిక డిజిటల్ దృష్టి పరీక్ష పూర్తయింది. మీ కుడి కన్ను స్కోరు ${odAcuity}, ఎడమ కన్ను స్కోరు ${osAcuity}. రంగు గుర్తింపు పరీక్షలో 5 కి ${colourScore} సరైన సమాధానాలు వచ్చాయి. ప్రాథమిక పరిశీలన ప్రకారం మీ దృష్టి సాధారణ పరిధిలో ఉన్నట్లు కనిపిస్తోంది. ఇది కేవలం ప్రాథమిక సమాచారం మాత్రమే, కంటి వైద్యుల సమగ్ర పరీక్షకు ప్రత్యామ్నాయం కాదు.`
  },
  hi: {
    tumblingPrompt: (eye, dir) => `अपनी ${eye === 'Right eye' ? 'दाईं आंख' : 'बाईं आंख'} से देखते हुए, E अक्षर किस दिशा में है? ऊपर, नीचे, बाएं या दाएं कहें या बटन दबाएं।`,
    tumblingComplete: "टम्बलिंग E परीक्षण पूरा हुआ। अब अक्षर दृष्टि परीक्षण शुरू हो रहा है।",
    alphabetPrompt: (eye) => `अपनी ${eye === 'Right eye' ? 'दाईं आंख' : 'बाईं आंख'} से देखते हुए, स्क्रीन पर कौन सा अक्षर है? अक्षर बोलें या नीचे दिए गए बटन पर टैप करें।`,
    alphabetComplete: "दृष्टि तीक्ष्णता परीक्षण पूरा हुआ। अब रंग दृष्टि परीक्षण शुरू हो रहा है।",
    colourPrompt: "वृत्ताकार प्लेट को देखें। बिंदुओं में कौन सा नंबर दिखाई दे रहा है? नंबर चुनें।",
    colourComplete: "रंग दृष्टि परीक्षण पूरा हुआ। आपकी अंतिम रिपोर्ट तैयार हो रही है।",
    instructions: "स्क्रीन से एक हाथ की दूरी पर आराम से बैठें। कमरे में उचित प्रकाश रखें। अपनी हथेली से बिना दबाए एक आंख ढकें। सबसे पहले हम आपकी दाईं आंख की जांच करेंगे।",
    precautions: "आंखों की सुरक्षा के लिए सावधानियां: पहला, 20-20-20 नियम का पालन करें। हर 20 मिनट में, 20 फीट दूर किसी वस्तु को 20 सेकंड के लिए देखें। दूसरा, आंखों के सूखेपन से बचने के लिए बार-बार पलकें झपकाएं। तीसरा, कमरे की रोशनी के अनुसार स्क्रीन की चमक सेट करें। चौथा, स्क्रीन को आंखों से 50 से 60 सेंटीमीटर की दूरी पर रखें। पांचवां, विटामिन ए और ओमेगा-3 युक्त संतुलित आहार लें। छठा, अचानक दृष्टि में बदलाव या दर्द होने पर तुरंत नेत्र चिकित्सक से संपर्क करें।",
    resultsReport: (odAcuity, osAcuity, colourScore) => `आपका प्रारंभिक डिजिटल दृष्टि परीक्षण पूरा हो गया है। आपकी दाईं आंख का स्तर ${odAcuity} और बाईं आंख का स्तर ${osAcuity} दर्ज किया गया है। रंग पहचान में 5 में से ${colourScore} सही रहे। प्रारंभिक संकेत सामान्य दृष्टि दर्शाते हैं। यह एक शैक्षिक स्क्रीनिंग है, डॉक्टर द्वारा की जाने वाली आंखों की जांच का विकल्प नहीं है।`
  },
  ta: {
    tumblingPrompt: (eye, dir) => `உங்கள் ${eye === 'Right eye' ? 'வலது கண்ணால்' : 'இடது கண்ணால்'} பார்த்து, E எழுத்து எந்த திசையை நோக்கி உள்ளது? மேலே, கீழே, இடது அல்லது வலது என்று சொல்லுங்கள்.`,
    tumblingComplete: "டம்ப்ளிங் E பரிசோதனை முடிந்தது. இப்போது எழுத்து பார்வை பரிசோதனை தொடங்குகிறது.",
    alphabetPrompt: (eye) => `உங்கள் ${eye === 'Right eye' ? 'வலது கண்ணால்' : 'இடது கண்ணால்'} பார்த்து, திரையில் எந்த எழுத்து தெரிகிறது? எழுத்தை சொல்லுங்கள் அல்லது பட்டனை அழுத்தவும்.`,
    alphabetComplete: "பார்வை திறன் பரிசோதனைகள் முடிந்தன. இப்போது வண்ண பார்வை பரிசோதனை தொடங்குகிறது.",
    colourPrompt: "வட்ட வடிவ தட்டைப் பாருங்கள். புள்ளிகளில் எந்த எண் தெரிகிறது? எண்ணைத் தேர்ந்தெடுக்கவும்.",
    colourComplete: "வண்ண பார்வை பரிசோதனை முடிந்தது. உங்கள் அறிக்கை தயாராகிறது.",
    instructions: "திரையிலிருந்து ஒரு கை நீள தூரத்தில் வசதியாக அமரவும். அறையில் சமச்சீரான வெளிச்சம் இருக்கட்டும். ஒரு கண்ணை அழுத்தாமல் உள்ளங்கையால் மூடவும். முதலில் உங்கள் வலது கண்ணை பரிசோதிப்போம்.",
    precautions: "கண் பாதுகாப்பு முன்னெச்சரிக்கைகள்: முதலாவதாக, 20-20-20 விதியைப் பின்பற்றுங்கள். ஒவ்வொரு 20 நிமிடங்களுக்கும், 20 அடி தூரத்தில் உள்ள பொருளை 20 வினாடிகள் பாருங்கள். இரண்டாவதாக, கண்கள் வறண்டு போகாமல் இருக்க அடிக்கடி கண்களை சிமிட்டுங்கள். மூன்றாவதாக, அறையின் வெளிச்சத்திற்கு ஏற்ப திரையின் வெளிச்சத்தை மாற்றவும். நான்காவதாக, திரையை கண்களிலிருந்து 50 முதல் 60 சென்டிமீட்டர் தூரத்தில் வைக்கவும். ஐந்தாவதாக, வைட்டமின் ஏ நிறைந்த சத்தான உணவுகளை உண்ணுங்கள். ஆறாவதாக, பார்வையில் திடீர் மாற்றம் அல்லது வலி ஏற்பட்டால் உடனடியாக கண் மருத்துவரை அணுகவும்.",
    resultsReport: (odAcuity, osAcuity, colourScore) => `உங்கள் முதற்கட்ட டிஜிட்டல் பார்வை பரிசோதனை முடிந்தது. உங்கள் வலது கண் பார்வை ${odAcuity}, இடது கண் பார்வை ${osAcuity}. வண்ண தட்டுகளில் 5 க்கு ${colourScore} சரியானவை. முடிவுகள் இயல்பான பார்வையை காட்டுகின்றன. இது ஒரு முதற்கட்ட பரிசோதனை மட்டுமே; கண் மருத்துவரிடம் முழுமையான பரிசோதனை மேற்கொள்வது நல்லது.`
  }
};

const VoiceEngine = {
  localeMap: {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN',
    ta: 'ta-IN'
  },
  availableVoices: [],
  recognitionState: 'idle', // 'idle' | 'starting' | 'listening' | 'stopping'

  init() {
    // 1. Initialize Speech Synthesis & Voices Cache
    if ('speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.onvoiceschanged = () => this.refreshVoices();
    }

    // 2. Mark recognition capability lazily (instantiate on demand to avoid background microphone lock)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    AppState.voice.supported = !!SpeechRecognition;
  },

  ensureRecognition() {
    if (AppState.voice.recognition) return AppState.voice.recognition;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        AppState.voice.recognition = new SpeechRecognition();
        AppState.voice.recognition.continuous = false;
        AppState.voice.recognition.interimResults = false;
        this.bindRecognitionEvents();
        return AppState.voice.recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
    return null;
  },

  refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    this.availableVoices = window.speechSynthesis.getVoices() || [];
    this.checkVoiceAvailability(AppState.language);
  },

  checkVoiceAvailability(lang) {
    if (!('speechSynthesis' in window)) return false;
    const targetLocale = voiceLanguages[lang]?.speechLanguage || this.localeMap[lang] || 'en-IN';
    
    // English is universally provided by default synthesizers
    if (lang === 'en') {
      AppState.voice.missingVoiceForLang = false;
      this.toggleMissingVoiceNotice(false);
      return true;
    }

    // Check if an Indic voice exists matching language code
    const hasVoice = this.availableVoices.some(v => 
      v.lang === targetLocale || 
      v.lang.toLowerCase().startsWith(lang) ||
      (v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(lang))
    );

    AppState.voice.missingVoiceForLang = !hasVoice;
    this.toggleMissingVoiceNotice(!hasVoice, lang);
    return hasVoice;
  },

  toggleMissingVoiceNotice(isMissing, lang = AppState.language) {
    const bannerT = document.getElementById('missingVoiceNoticeTumbling');
    const bannerA = document.getElementById('missingVoiceNoticeAlphabet');
    const textT = document.getElementById('missingVoiceNoticeTumblingText');
    const textA = document.getElementById('missingVoiceNoticeAlphabetText');

    if (!bannerT && !bannerA) return;

    if (isMissing) {
      const msgs = {
        te: "గమనిక: ఈ పరికరంలో తెలుగు వాయిస్ అందుబాటులో లేదు. ఆడియో నిలిపివేయబడింది. పూర్తి సూచనలు మరియు ప్రశ్నల బటన్లు తెరపై సక్రియంగా ఉన్నాయి.",
        hi: "सूचना: इस डिवाइस पर हिंदी वॉइस उपलब्ध नहीं है। स्क्रीन पर प्रदर्शित निर्देशों और विकल्पों का उपयोग करें।",
        ta: "குறிப்பு: இந்த சாதனத்தில் தமிழ் குரல் கிடைக்கவில்லை. திரையில் உள்ள வழிமுறைகள் மற்றும் பட்டன்களைப் பயன்படுத்தவும்.",
        en: "Notice: Indic speech voice pack not installed on this OS. Visual on-screen prompts are active."
      };
      const msg = msgs[lang] || msgs.en;
      if (bannerT) bannerT.style.display = 'flex';
      if (bannerA) bannerA.style.display = 'flex';
      if (textT) textT.textContent = msg;
      if (textA) textA.textContent = msg;
    } else {
      if (bannerT) bannerT.style.display = 'none';
      if (bannerA) bannerA.style.display = 'none';
    }
  },

  bindRecognitionEvents() {
    const rec = AppState.voice.recognition;
    if (!rec) return;

    rec.onstart = () => {
      this.recognitionState = 'listening';
      AppState.voice.isListening = true;
      this.updateVoiceUI();
    };

    rec.onresult = (event) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        AppState.voice.lastTranscript = transcript;
        console.log('Heard speech:', transcript);
        this.updateLiveHUD(transcript);
        this.handleSpokenInput(transcript);
      }
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.recognitionState = 'idle';
      AppState.voice.isListening = false;
      this.updateVoiceUI();
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        AppState.voice.permission = 'denied';
        this.showToast('Microphone access blocked. You can answer accurately using the on-screen buttons or arrow keys.');
      }
    };

    rec.onend = () => {
      this.recognitionState = 'idle';
      AppState.voice.isListening = false;
      this.updateVoiceUI();
    };
  },

  speak(text, onComplete = null) {
    if (!('speechSynthesis' in window)) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    
    // Stop recognition to prevent acoustic echo / self-listening loop
    this.stopListening();
    window.speechSynthesis.cancel();

    // Centralized speech language configuration (te-IN, hi-IN, ta-IN, en-IN)
    const activeLang = AppState.language || 'en';
    const locale = speechLanguages[activeLang] || 'en-IN';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best matching voice if available on browser/platform
    if (this.availableVoices && this.availableVoices.length > 0) {
      const match = this.availableVoices.find(v => 
        v.lang === locale || 
        v.lang.toLowerCase().startsWith(activeLang) ||
        (v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(activeLang))
      );
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      AppState.voice.isSpeaking = true;
      const statusEl = document.getElementById('audioFeedbackStatus');
      if (statusEl) statusEl.textContent = 'Speaking...';
    };

    utterance.onend = () => {
      AppState.voice.isSpeaking = false;
      const statusEl = document.getElementById('audioFeedbackStatus');
      if (statusEl) statusEl.textContent = 'Audio ready';
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    utterance.onerror = (e) => {
      AppState.voice.isSpeaking = false;
      console.warn('Speech synthesis error:', e);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    window.speechSynthesis.speak(utterance);
  },

  toggleResultsSpeech() {
    const btn = document.getElementById('btnSpeakResultsReport');
    const label = document.getElementById('btnSpeakResultsText');
    if (AppState.voice.isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      AppState.voice.isSpeaking = false;
      if (btn) btn.classList.remove('playing');
      if (label) label.textContent = I18N_TRANSLATIONS[AppState.language]?.btn_listen_results || 'Listen to Report';
      return;
    }
    const od = AppState.tumbling.odScore || '20/20';
    const os = AppState.tumbling.osScore || '20/20';
    const col = AppState.colour.score || 5;
    const textGen = SPOKEN_TEXTS[AppState.language]?.resultsReport || SPOKEN_TEXTS.en.resultsReport;
    const text = textGen(od, os, col);

    if (btn) btn.classList.add('playing');
    if (label) label.textContent = I18N_TRANSLATIONS[AppState.language]?.btn_stop_audio || 'Stop Audio';

    this.speak(text, () => {
      if (btn) btn.classList.remove('playing');
      if (label) label.textContent = I18N_TRANSLATIONS[AppState.language]?.btn_listen_results || 'Listen to Report';
    });
  },

  togglePrecautionsSpeech() {
    const btn = document.getElementById('btnSpeakPrecautions');
    const label = document.getElementById('btnSpeakPrecautionsText');
    if (AppState.voice.isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      AppState.voice.isSpeaking = false;
      if (btn) btn.classList.remove('playing');
      if (label) label.textContent = `🔊 ${I18N_TRANSLATIONS[AppState.language]?.btn_listen_precautions || 'Listen to Precautions'}`;
      return;
    }
    const text = SPOKEN_TEXTS[AppState.language]?.precautions || SPOKEN_TEXTS.en.precautions;

    if (btn) btn.classList.add('playing');
    if (label) label.textContent = `⏹ ${I18N_TRANSLATIONS[AppState.language]?.btn_stop_audio || 'Stop Audio'}`;

    this.speak(text, () => {
      if (btn) btn.classList.remove('playing');
      if (label) label.textContent = `🔊 ${I18N_TRANSLATIONS[AppState.language]?.btn_listen_precautions || 'Listen to Precautions'}`;
    });
  },

  startListening() {
    if (!AppState.voice.supported) {
      this.showToast('Microphone speech recognition is not supported in this browser. Please use the on-screen buttons.');
      return;
    }

    const rec = this.ensureRecognition();
    if (!rec) return;

    // Guard against starting if already active or computer is currently speaking
    if (this.recognitionState === 'listening' || this.recognitionState === 'starting' || AppState.voice.isSpeaking) {
      return;
    }

    try {
      this.recognitionState = 'starting';
      rec.lang = this.localeMap[AppState.language] || 'en-IN';
      rec.start();
    } catch (e) {
      this.recognitionState = 'idle';
      console.warn('Could not start recognition:', e);
    }
  },

  stopListening() {
    if (AppState.voice.recognition && (this.recognitionState === 'listening' || this.recognitionState === 'starting')) {
      try {
        this.recognitionState = 'stopping';
        AppState.voice.recognition.stop();
      } catch (e) {
        this.recognitionState = 'idle';
      }
    }
  },

  toggleListening() {
    if (AppState.voice.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },

  updateVoiceUI() {
    const btn = document.getElementById('btnToggleSpeechTest');
    const statusTitle = document.getElementById('voiceStatusTitle');
    const statusSub = document.getElementById('voiceStatusSubtitle');
    const transcriptOut = document.getElementById('voiceTranscriptOutput');
    const tDot = document.getElementById('tumblingMicPulseDot');
    const aDot = document.getElementById('alphabetMicPulseDot');
    const tHud = document.getElementById('tumblingSpeechHUD');
    const aHud = document.getElementById('alphabetSpeechHUD');

    if (btn) {
      btn.classList.toggle('listening', AppState.voice.isListening);
    }
    if (statusTitle) {
      statusTitle.textContent = AppState.voice.isListening ? 'Listening for speech...' : 'Tap to Test Voice Input';
    }
    if (statusSub) {
      statusSub.textContent = AppState.voice.isListening 
        ? 'Speak now ("Up", "Down", "Left", "Right", or letter names)' 
        : `Active language locale: ${this.localeMap[AppState.language] || 'en-IN'}`;
    }
    if (transcriptOut && AppState.voice.lastTranscript) {
      transcriptOut.textContent = `Heard: "${AppState.voice.lastTranscript}"`;
    }

    if (tDot) tDot.classList.toggle('listening', AppState.voice.isListening);
    if (aDot) aDot.classList.toggle('listening', AppState.voice.isListening);
    if (tHud) tHud.classList.toggle('active-listening', AppState.voice.isListening);
    if (aHud) aHud.classList.toggle('active-listening', AppState.voice.isListening);
  },

  updateLiveHUD(phrase) {
    const tBubble = document.getElementById('tumblingTranscriptBubble');
    const tText = document.getElementById('tumblingTranscriptText');
    const tStatus = document.getElementById('tumblingHUDStatus');
    const aBubble = document.getElementById('alphabetTranscriptBubble');
    const aText = document.getElementById('alphabetTranscriptText');
    const aStatus = document.getElementById('alphabetHUDStatus');

    if (tBubble && tText) {
      tText.textContent = `"${phrase}"`;
      tBubble.style.display = 'inline-flex';
    }
    if (tStatus) tStatus.textContent = `Recognized: "${phrase}"`;

    if (aBubble && aText) {
      aText.textContent = `"${phrase}"`;
      aBubble.style.display = 'inline-flex';
    }
    if (aStatus) aStatus.textContent = `Recognized: "${phrase}"`;
  },

  handleSpokenInput(phrase) {
    const p = phrase.toLowerCase();

    // Check modal transcript
    const transcriptEl = document.getElementById('voiceTranscriptOutput');
    if (transcriptEl) {
      transcriptEl.textContent = `Heard: "${phrase}"`;
    }

    // In Tumbling E Section (Multilingual commands across EN, TE, HI, TA)
    if (AppState.currentSection === 'tumbling') {
      if (p.includes('up') || p.includes('top') || p.includes('పైకి') || p.includes('పై') || p.includes('ऊपर') || p.includes('மேலே') || p.includes('மேல்')) {
        TumblingEngine.submitAnswer('up');
        return;
      }
      if (p.includes('down') || p.includes('bottom') || p.includes('క్రిందికి') || p.includes('కింద') || p.includes('नीचे') || p.includes('கீழே') || p.includes('கீழ்')) {
        TumblingEngine.submitAnswer('down');
        return;
      }
      if (p.includes('left') || p.includes('ఎడమ') || p.includes('बाएं') || p.includes('இடது') || p.includes('இடப்பக்கம்')) {
        TumblingEngine.submitAnswer('left');
        return;
      }
      if (p.includes('right') || p.includes('కుడి') || p.includes('दाएं') || p.includes('வலது') || p.includes('வலப்பக்கம்')) {
        TumblingEngine.submitAnswer('right');
        return;
      }
      if (p.includes("can't") || p.includes('cannot') || p.includes('small') || p.includes('blur') || 
          p.includes('కనిపించడం లేదు') || p.includes('కనపడటం లేదు') || 
          p.includes('नहीं दिख') || p.includes('धुंधला') || 
          p.includes('தெரியவில்லை') || p.includes('மங்கலாக')) {
        TumblingEngine.submitAnswer('cant_see');
        return;
      }
    }

    // In Alphabet Section (Letters and can't see)
    if (AppState.currentSection === 'alphabet') {
      if (p.includes("can't") || p.includes('cannot') || p.includes('small') || 
          p.includes('కనిపించడం లేదు') || p.includes('नहीं दिख') || p.includes('தெரியவில்லை')) {
        AlphabetEngine.submitAnswer('cant_see');
        return;
      }
      // Check for letters matching active choices
      for (const char of AppState.alphabet.currentChoices) {
        if (p === char.toLowerCase() || p.includes(`letter ${char.toLowerCase()}`) || p.startsWith(char.toLowerCase())) {
          AlphabetEngine.submitAnswer(char);
          return;
        }
      }
    }

    // General Voice Navigation commands across all 4 languages
    if (p.includes('repeat') || p.includes('మళ్లీ') || p.includes('दोबारा') || p.includes('மீண்டும்')) {
      if (AppState.currentSection === 'instructions') {
        Navigation.speakInstructions();
      } else if (AppState.currentSection === 'tumbling') {
        TumblingEngine.speakCurrentPrompt();
      } else if (AppState.currentSection === 'alphabet') {
        AlphabetEngine.speakCurrentPrompt();
      }
      return;
    }

    if (p.includes('next') || p.includes('తర్వాత') || p.includes('आगे') || p.includes('அடுத்து')) {
      if (AppState.currentSection === 'language') Navigation.goToSection('instructions');
      else if (AppState.currentSection === 'instructions') Navigation.goToSection('tumbling');
      return;
    }

    // Skip Commands across EN, TE, HI, TA
    if (p.includes('skip') || p.includes('దాటవేయి') || p.includes('छोड़') || p.includes('தவிர்')) {
      if (AppState.currentSection === 'tumbling') {
        Navigation.goToSection('alphabet');
      } else if (AppState.currentSection === 'alphabet') {
        Navigation.goToSection('colour');
      } else if (AppState.currentSection === 'colour') {
        Navigation.completeScreening();
      }
      return;
    }

    // Finish / Complete Commands across EN, TE, HI, TA
    if (p.includes('finish') || p.includes('complete') || p.includes('done') || p.includes('ముగించు') || p.includes('समाप्त') || p.includes('முடி')) {
      Navigation.completeScreening();
      return;
    }
  },

  showToast(msg) {
    let toast = document.getElementById('tyeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tyeToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 12px 20px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        font-size: 0.9rem;
        z-index: 2000;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }
};

// ==========================================================================
// 4. NAVIGATION & THEME CONTROLLER
// ==========================================================================
const Navigation = {
  sectionOrder: ['home', 'language', 'instructions', 'tumbling', 'alphabet', 'colour', 'results', 'learn'],

  init() {
    this.bindEvents();

    // Support URL query param for theme testing (?theme=light)
    try {
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get('theme');
      if (themeParam === 'light' || themeParam === 'dark') {
        AppState.theme = themeParam;
      }
    } catch (_) {}

    this.applyTheme(AppState.theme);
    this.applyLanguage(AppState.language);

    // Support direct hash navigation (#language, #results, etc.)
    const hashTarget = window.location.hash.replace('#', '');
    if (hashTarget && this.sectionOrder.includes(hashTarget)) {
      this.goToSection(hashTarget);
    } else {
      this.goToSection('home');
    }
  },

  bindEvents() {
    // Theme Switcher
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = AppState.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
      });
    }

    // Quick Home & Logo
    document.getElementById('navLogo')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.goToSection('home');
    });
    document.getElementById('quickHomeBtn')?.addEventListener('click', () => {
      this.goToSection('home');
    });

    // Voice Modal Button
    document.getElementById('voiceAssistantBtn')?.addEventListener('click', () => {
      this.openModal('modalVoiceAssistant');
    });
    document.getElementById('btnCloseVoiceModal')?.addEventListener('click', () => {
      this.closeModal('modalVoiceAssistant');
    });
    document.getElementById('btnDismissVoiceModal')?.addEventListener('click', () => {
      this.closeModal('modalVoiceAssistant');
    });
    document.getElementById('btnToggleSpeechTest')?.addEventListener('click', () => {
      VoiceEngine.toggleListening();
    });

    // Language in navbar quick action
    document.getElementById('langNavBtn')?.addEventListener('click', () => {
      this.goToSection('language');
    });

    // Section 1: Hero CTAs
    document.getElementById('btnStartScreening')?.addEventListener('click', () => {
      this.goToSection('language');
    });
    document.getElementById('btnExploreLearn')?.addEventListener('click', () => {
      this.goToSection('learn');
    });

    // Section 2: Language Selection
    const langCards = document.querySelectorAll('.language-card');
    langCards.forEach(card => {
      card.addEventListener('click', () => {
        const selectedLang = card.getAttribute('data-lang');
        this.applyLanguage(selectedLang);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const selectedLang = card.getAttribute('data-lang');
          this.applyLanguage(selectedLang);
        }
      });
    });
    document.getElementById('btnLangBack')?.addEventListener('click', () => {
      this.goToSection('home');
    });
    document.getElementById('btnLangConfirm')?.addEventListener('click', () => {
      this.goToSection('instructions');
    });

    // Section 3: Instructions
    document.getElementById('btnInstBack')?.addEventListener('click', () => {
      this.goToSection('language');
    });
    document.getElementById('btnStartTumblingTest')?.addEventListener('click', () => {
      TumblingEngine.startTest();
      this.goToSection('tumbling');
    });
    document.getElementById('btnSpeakInstructions')?.addEventListener('click', () => {
      this.speakInstructions();
    });

    // Section 4: Tumbling E Controls
    document.querySelectorAll('.dir-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-dir');
        TumblingEngine.submitAnswer(dir);
      });
    });
    document.getElementById('btnTumblingCantSee')?.addEventListener('click', () => {
      TumblingEngine.submitAnswer('cant_see');
    });
    document.getElementById('btnTumblingRepeatAudio')?.addEventListener('click', () => {
      TumblingEngine.speakCurrentPrompt();
    });
    document.getElementById('btnTumblingAbort')?.addEventListener('click', () => {
      this.openModal('modalRestartConfirm');
    });

    // Section 5: Alphabet Test Controls
    document.getElementById('btnAlphabetCantSee')?.addEventListener('click', () => {
      AlphabetEngine.submitAnswer('cant_see');
    });
    document.getElementById('btnAlphabetRepeatAudio')?.addEventListener('click', () => {
      AlphabetEngine.speakCurrentPrompt();
    });
    document.getElementById('btnAlphabetAbort')?.addEventListener('click', () => {
      this.openModal('modalRestartConfirm');
    });

    // Section 6: Colour Vision & Optional Tabs
    document.getElementById('tabBtnColour')?.addEventListener('click', () => {
      this.switchColourTab('colour-vision');
    });
    document.getElementById('tabBtnOptional')?.addEventListener('click', () => {
      this.switchColourTab('optional-tests');
    });
    document.getElementById('btnColourCantSee')?.addEventListener('click', () => {
      ColourEngine.submitAnswer('Nothing');
    });
    document.getElementById('btnSkipOptionalAll')?.addEventListener('click', () => {
      this.completeScreening();
    });
    document.getElementById('btnFinishToResults')?.addEventListener('click', () => {
      this.completeScreening();
    });
    document.getElementById('btnColourBack')?.addEventListener('click', () => {
      this.goToSection('alphabet');
    });

    // Optional Test Launchers
    document.getElementById('btnLaunchContrast')?.addEventListener('click', () => {
      OptionalTestsEngine.runContrastTest();
    });
    document.getElementById('btnLaunchAmsler')?.addEventListener('click', () => {
      OptionalTestsEngine.runAmslerTest();
    });
    document.getElementById('btnLaunchPeripheral')?.addEventListener('click', () => {
      OptionalTestsEngine.runPeripheralTest();
    });
    document.getElementById('btnCloseOptionalRunner')?.addEventListener('click', () => {
      this.closeModal('modalOptionalRunner');
    });

    // Section 7: Results Dashboard Actions
    document.getElementById('btnSpeakResultsReport')?.addEventListener('click', () => {
      VoiceEngine.toggleResultsSpeech();
    });
    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
      window.print();
    });
    document.getElementById('btnViewDetailedReportModal')?.addEventListener('click', () => {
      ResultsEngine.updatePrintableReport();
      this.openModal('modalDetailedReport');
    });
    document.getElementById('btnCloseReportModal')?.addEventListener('click', () => {
      this.closeModal('modalDetailedReport');
    });
    document.getElementById('btnDismissReportModal')?.addEventListener('click', () => {
      this.closeModal('modalDetailedReport');
    });
    document.getElementById('btnModalPrintTrigger')?.addEventListener('click', () => {
      window.print();
    });
    document.getElementById('btnRestartScreeningPrompt')?.addEventListener('click', () => {
      this.openModal('modalRestartConfirm');
    });
    document.getElementById('btnNavToLearn')?.addEventListener('click', () => {
      this.goToSection('learn');
    });

    // Section 8: Educational Learn Page
    document.getElementById('btnSpeakPrecautions')?.addEventListener('click', () => {
      VoiceEngine.togglePrecautionsSpeech();
    });
    document.getElementById('btnLearnBack')?.addEventListener('click', () => {
      this.goToSection('results');
    });
    document.getElementById('btnLearnToHome')?.addEventListener('click', () => {
      this.goToSection('home');
    });
    document.getElementById('btnPlayVoiceExplanation')?.addEventListener('click', () => {
      this.toggleAudioExplanation();
    });

    // 20-20-20 Timer Controls
    document.getElementById('btnStart20Timer')?.addEventListener('click', () => {
      RuleTimer.toggle();
    });
    document.getElementById('btnTest20Break')?.addEventListener('click', () => {
      RuleTimer.simulateBreak();
    });
    document.getElementById('btnReset20Timer')?.addEventListener('click', () => {
      RuleTimer.reset();
    });

    // Restart Modal Buttons
    document.getElementById('btnCancelRestartModal')?.addEventListener('click', () => {
      this.closeModal('modalRestartConfirm');
    });
    document.getElementById('btnAbortRestart')?.addEventListener('click', () => {
      this.closeModal('modalRestartConfirm');
    });
    document.getElementById('btnConfirmRestart')?.addEventListener('click', () => {
      this.closeModal('modalRestartConfirm');
      this.resetScreeningSession();
    });

    // Keyboard Shortcuts (Arrow keys & WASD for Tumbling, Letters/Numbers for Alphabet & Colour, Escape for modals)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
        return;
      }
      if (AppState.currentSection === 'tumbling') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); TumblingEngine.submitAnswer('up'); }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); TumblingEngine.submitAnswer('down'); }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); TumblingEngine.submitAnswer('left'); }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); TumblingEngine.submitAnswer('right'); }
        else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); TumblingEngine.submitAnswer('cant_see'); }
      } else if (AppState.currentSection === 'alphabet') {
        const k = e.key.toUpperCase();
        if (k >= 'A' && k <= 'Z') {
          if (AppState.alphabet.currentChoices.includes(k)) {
            e.preventDefault();
            AlphabetEngine.submitAnswer(k);
          } else if (k === 'C' && !AppState.alphabet.currentChoices.includes('C')) {
            e.preventDefault();
            AlphabetEngine.submitAnswer('cant_see');
          }
        } else if (k >= '1' && k <= '4') {
          const idx = parseInt(k, 10) - 1;
          if (AppState.alphabet.currentChoices[idx]) {
            e.preventDefault();
            AlphabetEngine.submitAnswer(AppState.alphabet.currentChoices[idx]);
          }
        }
      } else if (AppState.currentSection === 'colour') {
        const plate = AppState.colour.plates[AppState.colour.currentPlateIndex];
        if (plate) {
          if (e.key >= '1' && e.key <= '4') {
            const idx = parseInt(e.key, 10) - 1;
            if (plate.options[idx]) {
              e.preventDefault();
              ColourEngine.submitAnswer(plate.options[idx]);
            }
          } else if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            ColourEngine.submitAnswer('Nothing');
          }
        }
      }
    });

    // Navigation Links (Desktop, Mobile Menu, and Footer)
    const mobileToggle = document.getElementById('btnMobileNavToggle');
    const mobileMenu = document.getElementById('mobileNavMenu');
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
        mobileMenu.classList.toggle('open', !isExpanded);
        const ham = mobileToggle.querySelector('.hamburger-icon');
        const close = mobileToggle.querySelector('.close-icon');
        if (ham && close) {
          ham.style.display = isExpanded ? 'block' : 'none';
          close.style.display = isExpanded ? 'none' : 'block';
        }
      });
    }

    document.querySelectorAll('.nav-link, .mobile-nav-link, .footer-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        if (target) {
          this.goToSection(target);
          if (mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenu.classList.remove('open');
            mobileToggle?.setAttribute('aria-expanded', 'false');
            const ham = mobileToggle?.querySelector('.hamburger-icon');
            const close = mobileToggle?.querySelector('.close-icon');
            if (ham && close) {
              ham.style.display = 'block';
              close.style.display = 'none';
            }
          }
        }
      });
    });

    // Screen DPI Calibration Tool Event Handlers
    document.getElementById('btnNavCalibration')?.addEventListener('click', () => {
      this.openModal('modalScreenCalibration');
    });
    document.getElementById('btnLaunchCalibrationFromInst')?.addEventListener('click', () => {
      this.openModal('modalScreenCalibration');
    });
    document.getElementById('btnCloseCalibrationModal')?.addEventListener('click', () => {
      this.closeModal('modalScreenCalibration');
    });

    ['presetLaptop', 'presetDesktop', 'presetMobile'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        document.querySelectorAll('.calib-preset-btn').forEach(b => b.classList.remove('active'));
        const btn = e.currentTarget;
        btn.classList.add('active');
        const scale = parseFloat(btn.getAttribute('data-scale')) || 1.0;
        AppState.calibrationScale = scale;
        const slider = document.getElementById('sliderCardWidth');
        const box = document.getElementById('rulerCardBox');
        if (slider) slider.value = Math.round(280 * scale);
        if (box) box.style.width = `${Math.round(280 * scale)}px`;
      });
    });

    document.getElementById('sliderCardWidth')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const box = document.getElementById('rulerCardBox');
      if (box) box.style.width = `${val}px`;
      AppState.calibrationScale = val / 280;
      document.querySelectorAll('.calib-preset-btn').forEach(b => b.classList.remove('active'));
    });

    document.getElementById('btnSaveCalibration')?.addEventListener('click', () => {
      localStorage.setItem('tye_calib', AppState.calibrationScale);
      this.closeModal('modalScreenCalibration');
      VoiceEngine.showToast('Screen physical calibration saved successfully.');
      if (AppState.currentSection === 'tumbling') TumblingEngine.renderStage();
      else if (AppState.currentSection === 'alphabet') AlphabetEngine.renderStage();
    });

    document.getElementById('btnResetCalibration')?.addEventListener('click', () => {
      AppState.calibrationScale = 1.0;
      localStorage.setItem('tye_calib', '1.0');
      const slider = document.getElementById('sliderCardWidth');
      const box = document.getElementById('rulerCardBox');
      if (slider) slider.value = 280;
      if (box) box.style.width = '280px';
      document.querySelectorAll('.calib-preset-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('presetLaptop')?.classList.add('active');
      this.closeModal('modalScreenCalibration');
      VoiceEngine.showToast('Calibration reset to standard default.');
      if (AppState.currentSection === 'tumbling') TumblingEngine.renderStage();
      else if (AppState.currentSection === 'alphabet') AlphabetEngine.renderStage();
    });

    // Monocular Eye-Switch Gate Proceed Handler
    document.getElementById('btnConfirmEyeSwitchProceed')?.addEventListener('click', () => {
      this.closeModal('modalEyeSwitchGate');
      if (this.pendingEyeSwitchCallback) {
        const cb = this.pendingEyeSwitchCallback;
        this.pendingEyeSwitchCallback = null;
        cb();
      }
    });
  },

  triggerEyeSwitchGate(testType) {
    this.openModal('modalEyeSwitchGate');
    const eyeTexts = {
      en: "Right eye testing complete. Please pause for a few seconds, gently cover your right eye with your palm, and get ready to test your left eye.",
      te: "కుడి కంటి పరీక్ష పూర్తయింది. దయచేసి కుడి కన్నును అరచేతితో మూసి ఎడమ కంటి పరీక్షను ప్రారంభించండి.",
      hi: "दाईं आंख की जांच पूरी हुई। अब अपनी दाईं आंख को ढकें और बाईं आंख की जांच शुरू करें।",
      ta: "வலது கண் பரிசோதனை முடிந்தது. உங்கள் வலது கண்ணை மூடி இடது கண் சோதனையைத் தொடங்குங்கள்."
    };
    const eyeSpeech = eyeTexts[AppState.language] || eyeTexts.en;
    VoiceEngine.speak(eyeSpeech);

    this.pendingEyeSwitchCallback = () => {
      if (testType === 'tumbling') {
        AppState.tumbling.currentEye = 'OS';
        AppState.tumbling.stepIndex = 0;
        TumblingEngine.renderStage();
      } else if (testType === 'alphabet') {
        AppState.alphabet.currentEye = 'OS';
        AppState.alphabet.stepIndex = 0;
        AlphabetEngine.renderStage();
      }
    };
  },

  applyTheme(theme) {
    AppState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tye_theme', theme);
  },

  applyLanguage(lang) {
    if (!I18N_TRANSLATIONS[lang]) lang = 'en';
    AppState.language = lang;
    localStorage.setItem('tye_lang', lang);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      AppState.voice.isSpeaking = false;
    }

    // Refresh voice availability for newly selected language
    VoiceEngine.checkVoiceAvailability(lang);

    // Update Language Card Highlights
    document.querySelectorAll('.language-card').forEach(card => {
      const cardLang = card.getAttribute('data-lang');
      card.classList.toggle('active-lang', cardLang === lang);
    });

    // Update Nav Tag
    const tag = document.getElementById('currentLangTag');
    if (tag) {
      const names = { en: 'English', te: 'తెలుగు', hi: 'हिन्दी', ta: 'தமிழ்' };
      tag.textContent = names[lang] || 'English';
    }

    // Translate DOM elements marked with [data-i18n]
    const dict = I18N_TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Re-render current test prompt if in active test
    if (AppState.currentSection === 'tumbling') {
      TumblingEngine.renderStage();
    } else if (AppState.currentSection === 'alphabet') {
      AlphabetEngine.renderStage();
    }
  },

  goToSection(sectionId) {
    AppState.currentSection = sectionId;

    // Toggle Section visibility
    document.querySelectorAll('.page-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetEl = document.getElementById(`section${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}`);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Update active nav links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      const target = link.getAttribute('data-target');
      const isTarget = target === sectionId || 
        (target === 'language' && (sectionId === 'language' || sectionId === 'instructions' || sectionId === 'tumbling' || sectionId === 'alphabet' || sectionId === 'colour'));
      link.classList.toggle('active', isTarget);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle Stepper Visibility and Active Step
    const stepper = document.getElementById('screeningStepper');
    const navProgress = document.getElementById('navProgressContainer');

    const stepMap = {
      language: 1,
      instructions: 2,
      tumbling: 3,
      alphabet: 4,
      colour: 5,
      results: 6
    };

    if (stepMap[sectionId]) {
      if (stepper) stepper.style.display = 'block';
      if (navProgress) navProgress.style.display = 'flex';
      this.updateStepper(stepMap[sectionId]);
    } else {
      if (stepper) stepper.style.display = 'none';
      if (navProgress) navProgress.style.display = 'none';
    }

    if (sectionId === 'tumbling') {
      TumblingEngine.renderStage();
    } else if (sectionId === 'alphabet') {
      AlphabetEngine.renderStage();
    }
  },

  updateStepper(currentStepNum) {
    document.querySelectorAll('.step-node').forEach(node => {
      const step = parseInt(node.getAttribute('data-step'), 10);
      node.classList.remove('active', 'completed');
      if (step < currentStepNum) {
        node.classList.add('completed');
      } else if (step === currentStepNum) {
        node.classList.add('active');
      }
    });

    const percent = Math.round((currentStepNum / 6) * 100);
    const navFill = document.getElementById('navProgressFill');
    const navLabel = document.getElementById('navStepLabel');
    if (navFill) navFill.style.width = `${percent}%`;
    if (navLabel) navLabel.textContent = `Step ${currentStepNum} of 6`;
  },

  switchColourTab(tabName) {
    const isColour = tabName === 'colour-vision';
    document.getElementById('tabBtnColour')?.classList.toggle('active', isColour);
    document.getElementById('tabBtnOptional')?.classList.toggle('active', !isColour);
    document.getElementById('panelColourVision')?.classList.toggle('active', isColour);
    document.getElementById('panelOptionalTests')?.classList.toggle('active', !isColour);
  },

  speakInstructions() {
    const texts = {
      en: "Sit comfortably at an arm's length distance from your screen. Make sure your room has balanced lighting. Cup your palm gently over one eye without pressing the eyeball. First, we will test your right eye.",
      te: "మీ స్క్రీన్ నుండి చేతి దూరంలో సౌకర్యవంతంగా కూర్చోండి. గదిలో సరైన వెలుతురు ఉండేలా చూసుకోండి. మీ అరచేతితో ఒక కన్నును నొక్కకుండా మూయండి. ముందుగా కుడి కన్ను పరీక్షిస్తాము.",
      hi: "स्क्रीन से एक हाथ की दूरी पर आराम से बैठें। कमरे में उचित प्रकाश रखें। अपनी हथेली से बिना दबाए एक आंख ढकें। सबसे पहले हम आपकी दाईं आंख की जांच करेंगे।",
      ta: "திரையிலிருந்து ஒரு கை நீள தூரத்தில் வசதியாக அமரவும். அறையில் சமச்சீரான வெளிச்சம் இருக்கட்டும். ஒரு கண்ணை அழுத்தாமல் உள்ளங்கையால் மூடவும். முதலில் உங்கள் வலது கண்ணை பரிசோதிப்போம்."
    };
    const speech = texts[AppState.language] || texts.en;
    VoiceEngine.speak(speech);
  },

  toggleAudioExplanation() {
    const waveEl = document.getElementById('waveformBars');
    const statusEl = document.getElementById('audioTrackStatus');

    if (AppState.voice.isSpeaking) {
      window.speechSynthesis.cancel();
      AppState.voice.isSpeaking = false;
      waveEl?.classList.remove('playing');
      if (statusEl) statusEl.textContent = 'Audio paused';
      return;
    }

    const explanations = {
      en: "This audio overview explains your eyesight screening. Visual acuity is measured in Snellen fractions. 20/20 indicates standard resolving clarity. Remember the 20-20-20 rule to relax your eye muscles during prolonged digital screen usage.",
      te: "ఈ ఆడియో సారాంశం మీ దృష్టి పరీక్ష ఫలితాలను వివరిస్తుంది. 20/20 సాధారణ దృష్టిని సూచిస్తుంది. స్క్రీన్ వాడేటప్పుడు కంటి అలసటను తగ్గించడానికి 20-20-20 నియమాన్ని పాటించండి.",
      hi: "यह ऑडियो स्पष्टीकरण आपके नेत्र परीक्षण के बारे में है। 20/20 सामान्य दृष्टि मानी जाती है। स्क्रीन पर काम करते समय अपनी आंखों को आराम देने के लिए 20-20-20 नियम का पालन अवश्य करें।",
      ta: "இந்த ஆடியோ விளக்கம் உங்கள் பார்வை முடிவுகளை விளக்குகிறது. 20/20 என்பது இயல்பான பார்வை. கணினியை பயன்படுத்தும்போது உங்கள் கண் தசைகளை தளர்த்த 20-20-20 விதியை பின்பற்றுங்கள்."
    };

    waveEl?.classList.add('playing');
    if (statusEl) statusEl.textContent = 'Playing personalized explanation...';
    VoiceEngine.speak(explanations[AppState.language] || explanations.en);

    // Stop waveform when finished
    const checkInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        waveEl?.classList.remove('playing');
        if (statusEl) statusEl.textContent = 'Audio summary completed';
        clearInterval(checkInterval);
      }
    }, 500);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  },

  resetScreeningSession() {
    // Generate fresh session seed for brand new randomized test run
    AppState.sessionSeed = generateSessionSeed();

    // Reset test states
    AppState.tumbling.currentEye = 'OD';
    AppState.tumbling.stepIndex = 0;
    AppState.tumbling.odAnswers = [];
    AppState.tumbling.osAnswers = [];
    AppState.tumbling.odScore = 'Unresolved';
    AppState.tumbling.osScore = 'Unresolved';

    AppState.alphabet.currentEye = 'OD';
    AppState.alphabet.stepIndex = 0;
    AppState.alphabet.odAnswers = [];
    AppState.alphabet.osAnswers = [];
    AppState.alphabet.odScore = 'Unresolved';
    AppState.alphabet.osScore = 'Unresolved';

    AppState.colour.currentPlateIndex = 0;
    AppState.colour.answers = [];
    AppState.colour.score = 0;

    AppState.optional.contrastResult = 'Not Taken';
    AppState.optional.amslerResult = 'Not Taken';
    AppState.optional.peripheralResult = 'Not Taken';

    RuleTimer.reset();
    VoiceEngine.stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    this.goToSection('home');
    VoiceEngine.showToast('Screening reset. Ready for a new assessment.');
  },

  completeScreening() {
    ResultsEngine.calculateResults();
    this.goToSection('results');
  }
};

// ==========================================================================
// 5. TUMBLING E VISUAL ACUITY ENGINE
// ==========================================================================
const TumblingEngine = {
  directions: ['up', 'down', 'left', 'right'],
  rotations: {
    up: -90,
    right: 0,
    down: 90,
    left: 180
  },

  startTest() {
    AppState.tumbling.currentEye = 'OD';
    AppState.tumbling.stepIndex = 0;
    AppState.tumbling.odAnswers = [];
    AppState.tumbling.osAnswers = [];
    this.renderStage();
  },

  renderStage() {
    const state = AppState.tumbling;
    const currentEye = state.currentEye;
    const step = state.stepIndex;
    const level = state.levels[step];

    // Pick random direction avoiding immediate repetition
    let randomDir;
    do {
      randomDir = this.directions[Math.floor(Math.random() * this.directions.length)];
    } while (this.directions.length > 1 && randomDir === state.currentDirection);
    state.currentDirection = randomDir;

    // DOM Elements
    const badge = document.getElementById('tumblingEyeLabel');
    const levelDisplay = document.getElementById('tumblingLevelDisplay');
    const stepCounter = document.getElementById('tumblingStepCounter');
    const progressFill = document.getElementById('tumblingProgressFill');
    const symbolEl = document.getElementById('tumblingSymbol');
    const instructionText = document.getElementById('tumblingInstructionText');

    if (badge) {
      let label = 'TESTING RIGHT EYE (OD)';
      if (AppState.language === 'te') {
        label = currentEye === 'OD' ? 'కుడి కంటి పరీక్ష (OD)' : 'ఎడమ కంటి పరీక్ష (OS)';
      } else if (AppState.language === 'hi') {
        label = currentEye === 'OD' ? 'दाईं आंख की जांच (OD)' : 'बाईं आंख की जांच (OS)';
      } else if (AppState.language === 'ta') {
        label = currentEye === 'OD' ? 'வலது கண் பரிசோதனை (OD)' : 'இடது கண் பரிசோதனை (OS)';
      } else {
        label = currentEye === 'OD' ? 'TESTING RIGHT EYE (OD)' : 'TESTING LEFT EYE (OS)';
      }
      badge.textContent = label;
    }

    if (levelDisplay && level) {
      levelDisplay.textContent = level.snellen;
    }

    if (stepCounter) {
      stepCounter.textContent = `(Question ${step + 1} of 6)`;
    }

    if (progressFill) {
      const pct = Math.round(((step + 1) / 6) * 100);
      progressFill.style.width = `${pct}%`;
    }

    if (symbolEl && level) {
      const stage = document.getElementById('tumblingStage');
      const stageDim = stage ? Math.min(stage.clientWidth || 140, stage.clientHeight || 140) : 140;
      const calib = Math.max(0.75, Math.min(1.3, AppState.calibrationScale || 1.0));
      const targetPx = Math.round(stageDim * level.baseFraction * calib * 1.5);
      const clampedSize = Math.max(level.minPx, Math.min(level.maxPx, targetPx));
      symbolEl.style.fontSize = `${clampedSize}px`;
      symbolEl.style.transform = `rotate(${this.rotations[randomDir]}deg)`;
    }

    if (instructionText) {
      let eyeText = '';
      if (AppState.language === 'te') {
        eyeText = currentEye === 'OD'
          ? 'మీ ఎడమ కన్నును అరచేతితో మూసుకోండి. E అక్షరం కాళ్ళు ఏ దిశలో ఉన్నాయో ఎంచుకోండి.'
          : 'మీ కుడి కన్నును అరచేతితో మూసుకోండి. E అక్షరం కాళ్ళు ఏ దిశలో ఉన్నాయో ఎంచుకోండి.';
      } else if (AppState.language === 'hi') {
        eyeText = currentEye === 'OD'
          ? 'अपनी बाईं आंख को हथेली से ढकें। E अक्षर की भुजाएं किस दिशा में हैं, चुनें।'
          : 'अपनी दाईं आंख को हथेली से ढकें। E अक्षर की भुजाएं किस दिशा में हैं, चुनें।';
      } else if (AppState.language === 'ta') {
        eyeText = currentEye === 'OD'
          ? 'உங்கள் இடது கண்ணை உள்ளங்கையால் மூடுங்கள். E எழுத்தின் திறந்த பகுதி எந்த திசையை நோக்கி உள்ளது என்பதைத் தேர்ந்தெடுக்கவும்.'
          : 'உங்கள் வலது கண்ணை உள்ளங்கையால் மூடுங்கள். E எழுத்தின் திறந்த பகுதி எந்த திசையை நோக்கி உள்ளது என்பதைத் தேர்ந்தெடுக்கவும்.';
      } else {
        eyeText = currentEye === 'OD'
          ? 'Cover your LEFT eye with your palm. Select the direction the open legs of the letter E are pointing.'
          : 'Cover your RIGHT eye with your palm. Select the direction the open legs of the letter E are pointing.';
      }
      instructionText.textContent = eyeText;
    }

    // Auto-listen for voice answer if voice is enabled and computer is not currently speaking
    if (AppState.voice.supported && !AppState.voice.isListening && !AppState.voice.isSpeaking) {
      VoiceEngine.startListening();
    }
  },

  submitAnswer(chosenDir) {
    const state = AppState.tumbling;
    const currentEye = state.currentEye;
    const step = state.stepIndex;
    const level = state.levels[step];
    const isCorrect = chosenDir === state.currentDirection;

    const record = {
      level: level.snellen,
      size: level.maxPx,
      correct: isCorrect,
      chosen: chosenDir,
      target: state.currentDirection
    };

    if (currentEye === 'OD') {
      state.odAnswers.push(record);
      if (isCorrect) state.odScore = level.snellen;
    } else {
      state.osAnswers.push(record);
      if (isCorrect) state.osScore = level.snellen;
    }

    // Advance to next step or next eye
    if (step < state.levels.length - 1 && chosenDir !== 'cant_see') {
      state.stepIndex++;
      this.renderStage();
    } else {
      // Finished 6 levels or user clicked "can't see"
      if (currentEye === 'OD') {
        // Trigger Monocular Eye-Switch Gate Modal
        Navigation.triggerEyeSwitchGate('tumbling');
      } else {
        // Both eyes completed! Move to Alphabet test
        const transitionMsg = SPOKEN_TEXTS[AppState.language]?.tumblingComplete || SPOKEN_TEXTS.en.tumblingComplete;
        VoiceEngine.speak(transitionMsg, () => {
          AlphabetEngine.startTest();
          Navigation.goToSection('alphabet');
        });
      }
    }
  },

  speakCurrentPrompt() {
    const isOD = AppState.tumbling.currentEye === 'OD';
    let eyeName;
    if (AppState.language === 'te') {
      eyeName = isOD ? 'కుడి కంటితో' : 'ఎడమ కంటితో';
    } else if (AppState.language === 'hi') {
      eyeName = isOD ? 'दाईं आंख' : 'बाईं आंख';
    } else if (AppState.language === 'ta') {
      eyeName = isOD ? 'வலது கண்ணால்' : 'இடது கண்ணால்';
    } else {
      eyeName = isOD ? 'Right eye' : 'Left eye';
    }
    const textGen = SPOKEN_TEXTS[AppState.language]?.tumblingPrompt || SPOKEN_TEXTS.en.tumblingPrompt;
    const speech = textGen(eyeName, AppState.tumbling.currentDirection);
    VoiceEngine.speak(speech);
  }
};

// ==========================================================================
// 6. ALPHABET VISUAL ACUITY ENGINE (SNELLEN LETTERS)
// ==========================================================================
const AlphabetEngine = {
  startTest() {
    AppState.alphabet.currentEye = 'OD';
    AppState.alphabet.stepIndex = 0;
    AppState.alphabet.odAnswers = [];
    AppState.alphabet.osAnswers = [];
    this.renderStage();
  },

  renderStage() {
    const state = AppState.alphabet;
    const currentEye = state.currentEye;
    const step = state.stepIndex;
    const level = state.levels[step];

    // Pick random letter from pool avoiding immediate repetition
    const pool = state.letterPool;
    let targetLetter;
    do {
      targetLetter = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && targetLetter === state.currentLetter);
    state.currentLetter = targetLetter;

    // Pick 3 random distractors
    const distractors = pool.filter(l => l !== targetLetter);
    distractors.sort(() => 0.5 - Math.random());
    const choices = [targetLetter, distractors[0], distractors[1], distractors[2]];
    choices.sort(() => 0.5 - Math.random());
    state.currentChoices = choices;

    // DOM Elements
    const badge = document.getElementById('alphabetEyeLabel');
    const levelDisplay = document.getElementById('alphabetLevelDisplay');
    const stepCounter = document.getElementById('alphabetStepCounter');
    const progressFill = document.getElementById('alphabetProgressFill');
    const letterDisplay = document.getElementById('snellenLetterDisplay');
    const instructionText = document.getElementById('alphabetInstructionText');
    const choicesGrid = document.getElementById('letterChoicesGrid');

    if (badge) {
      let label = 'TESTING RIGHT EYE (OD)';
      if (AppState.language === 'te') {
        label = currentEye === 'OD' ? 'కుడి కంటి పరీక్ష (OD)' : 'ఎడమ కంటి పరీక్ష (OS)';
      } else if (AppState.language === 'hi') {
        label = currentEye === 'OD' ? 'दाईं आंख की जांच (OD)' : 'बाईं आंख की जांच (OS)';
      } else if (AppState.language === 'ta') {
        label = currentEye === 'OD' ? 'வலது கண் பரிசோதனை (OD)' : 'இடது கண் பரிசோதனை (OS)';
      } else {
        label = currentEye === 'OD' ? 'TESTING RIGHT EYE (OD)' : 'TESTING LEFT EYE (OS)';
      }
      badge.textContent = label;
    }

    if (levelDisplay && level) {
      levelDisplay.textContent = level.snellen;
    }

    if (stepCounter) {
      stepCounter.textContent = `(Letter ${step + 1} of 6)`;
    }

    if (progressFill) {
      const pct = Math.round(((step + 1) / 6) * 100);
      progressFill.style.width = `${pct}%`;
    }

    if (letterDisplay && level) {
      const stage = document.getElementById('alphabetStage');
      const stageDim = stage ? Math.min(stage.clientWidth || 140, stage.clientHeight || 140) : 140;
      const calib = Math.max(0.75, Math.min(1.3, AppState.calibrationScale || 1.0));
      const targetPx = Math.round(stageDim * level.baseFraction * calib * 1.5);
      const clampedSize = Math.max(level.minPx, Math.min(level.maxPx, targetPx));
      letterDisplay.textContent = targetLetter;
      letterDisplay.style.fontSize = `${clampedSize}px`;
    }

    if (instructionText) {
      let eyeText = '';
      if (AppState.language === 'te') {
        eyeText = currentEye === 'OD'
          ? 'మీ ఎడమ కన్నును అరచేతితో మూసుకోండి. తెరపై కనిపించే అక్షరాన్ని క్రింది బటన్ల ద్వారా లేదా మాట్లాడి గుర్తించండి.'
          : 'మీ కుడి కన్నును అరచేతితో మూసుకోండి. తెరపై కనిపించే అక్షరాన్ని క్రింది బటన్ల ద్వారా లేదా మాట్లాడి గుర్తించండి.';
      } else if (AppState.language === 'hi') {
        eyeText = currentEye === 'OD'
          ? 'अपनी बाईं आंख को हथेली से ढकें। नीचे दिए गए बटनों या बोलकर स्क्रीन पर दिख रहे अक्षर को पहचानें।'
          : 'अपनी दाईं आंख को हथेली से ढकें। नीचे दिए गए बटनों या बोलकर स्क्रीन पर दिख रहे अक्षर को पहचानें।';
      } else if (AppState.language === 'ta') {
        eyeText = currentEye === 'OD'
          ? 'உங்கள் இடது கண்ணை மூடுங்கள். திரையில் தோன்றும் எழுத்தை கீழே உள்ள பொத்தான்கள் மூலமாகவோ அல்லது பேசியோ அடையாளம் காணவும்.'
          : 'உங்கள் வலது கண்ணை மூடுங்கள். திரையில் தோன்றும் எழுத்தை கீழே உள்ள பொத்தான்கள் மூலமாகவோ அல்லது பேசியோ அடையாளம் காணவும்.';
      } else {
        eyeText = currentEye === 'OD'
          ? 'Cover your LEFT eye. Identify the letter shown on screen using the buttons below or by speaking.'
          : 'Cover your RIGHT eye. Identify the letter shown on screen using the buttons below or by speaking.';
      }
      instructionText.textContent = eyeText;
    }

    // Render Answer Choice Buttons
    if (choicesGrid) {
      choicesGrid.innerHTML = '';
      choices.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'letter-choice-btn';
        btn.textContent = letter;
        btn.setAttribute('aria-label', `Letter ${letter}`);
        btn.addEventListener('click', () => {
          this.submitAnswer(letter);
        });
        choicesGrid.appendChild(btn);
      });
    }

    // Auto-listen for voice answer if voice is enabled and computer is not currently speaking
    if (AppState.voice.supported && !AppState.voice.isListening && !AppState.voice.isSpeaking) {
      VoiceEngine.startListening();
    }
  },

  submitAnswer(chosenLetter) {
    const state = AppState.alphabet;
    const currentEye = state.currentEye;
    const step = state.stepIndex;
    const level = state.levels[step];
    const isCorrect = chosenLetter.toUpperCase() === state.currentLetter.toUpperCase();

    const record = {
      level: level.snellen,
      size: level.maxPx,
      correct: isCorrect,
      chosen: chosenLetter,
      target: state.currentLetter
    };

    if (currentEye === 'OD') {
      state.odAnswers.push(record);
      if (isCorrect) state.odScore = level.snellen;
    } else {
      state.osAnswers.push(record);
      if (isCorrect) state.osScore = level.snellen;
    }

    // Advance step or switch eye
    if (step < state.levels.length - 1 && chosenLetter !== 'cant_see') {
      state.stepIndex++;
      this.renderStage();
    } else {
      if (currentEye === 'OD') {
        // Trigger Monocular Eye-Switch Gate Modal
        Navigation.triggerEyeSwitchGate('alphabet');
      } else {
        const transitionMsg = SPOKEN_TEXTS[AppState.language]?.alphabetComplete || SPOKEN_TEXTS.en.alphabetComplete;
        VoiceEngine.speak(transitionMsg, () => {
          ColourEngine.startTest();
          Navigation.goToSection('colour');
        });
      }
    }
  },

  speakCurrentPrompt() {
    const isOD = AppState.alphabet.currentEye === 'OD';
    let eyeName;
    if (AppState.language === 'te') {
      eyeName = isOD ? 'కుడి కంటితో' : 'ఎడమ కంటితో';
    } else if (AppState.language === 'hi') {
      eyeName = isOD ? 'दाईं आंख' : 'बाईं आंख';
    } else if (AppState.language === 'ta') {
      eyeName = isOD ? 'வலது கண்ணால்' : 'இடது கண்ணால்';
    } else {
      eyeName = isOD ? 'Right eye' : 'Left eye';
    }
    const textGen = SPOKEN_TEXTS[AppState.language]?.alphabetPrompt || SPOKEN_TEXTS.en.alphabetPrompt;
    const speech = textGen(eyeName);
    VoiceEngine.speak(speech);
  }
};

// ==========================================================================
// 7. CALIBRATED PSEUDOISOCHROMATIC COLOUR PLATES ENGINE
// ==========================================================================
const ColourEngine = {
  startTest() {
    AppState.colour.currentPlateIndex = 0;
    AppState.colour.answers = [];
    AppState.colour.score = 0;

    // Dynamically generate 5 plates from the number pool per session
    const pool = AppState.colour.numberPool || ['12', '8', '5', '29', '74', '6', '3', '15', '16', '26', '45', '97'];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = ['12', ...shuffled.filter(n => n !== '12').slice(0, 4)];

    AppState.colour.plates = selected.map((num, idx) => {
      const numInt = parseInt(num, 10);
      const distractors = [
        String(numInt > 10 ? (numInt % 10) * 10 + Math.floor(numInt / 10) : numInt + 3),
        String(Math.abs(numInt - 5) || 7),
        'Nothing'
      ];
      const options = [num, ...distractors.filter(d => d !== num).slice(0, 3)];
      options.sort(() => 0.5 - Math.random());
      return {
        id: idx + 1,
        number: num,
        options: options,
        normalAnswer: num,
        description: idx === 0 
          ? 'Demonstration plate. Visible to typical and colour-deficient vision.' 
          : 'Pseudoisochromatic plate simulation for red-green discrimination.'
      };
    });

    this.renderPlate();
    this.speakCurrentPrompt();
  },

  renderPlate() {
    const state = AppState.colour;
    const plate = state.plates[state.currentPlateIndex];
    if (!plate) return;

    // Update Header Meta
    const plateIdxEl = document.getElementById('colourPlateIndex');
    const fillEl = document.getElementById('colourProgressFill');
    if (plateIdxEl) plateIdxEl.textContent = state.currentPlateIndex + 1;
    if (fillEl) fillEl.style.width = `${((state.currentPlateIndex + 1) / state.plates.length) * 100}%`;

    // Render Calibrated High-Fidelity SVG Plate
    const container = document.getElementById('plateContainer');
    if (container) {
      container.innerHTML = this.generatePlateSVG(plate.number, state.currentPlateIndex);
    }

    // Render Answer Options
    const optionsGrid = document.getElementById('colourOptionsGrid');
    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      plate.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'colour-opt-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          this.submitAnswer(opt);
        });
        optionsGrid.appendChild(btn);
      });
    }
  },

  generatePlateSVG(number, plateIndex) {
    const width = 340;
    const height = 340;
    const cx = 170;
    const cy = 170;
    const r = 155;

    const palettes = [
      { bg: ['#2a9d8f', '#264653', '#3a86ff', '#48cae4'], fg: ['#e76f51', '#f4a261', '#e63946', '#ffb703'] },
      { bg: ['#588157', '#3a5a40', '#6b705c', '#7f7f7f'], fg: ['#e76f51', '#d9480f', '#f4a261', '#e63946'] },
      { bg: ['#d4a373', '#bc6c25', '#dda15e', '#b08968'], fg: ['#2d6a4f', '#40916c', '#52b788', '#1b4332'] },
      { bg: ['#606c38', '#283618', '#4f772d', '#7b9e89'], fg: ['#e76f51', '#f77f00', '#d62828', '#fcbf49'] },
      { bg: ['#d62828', '#e07a5f', '#f4a261', '#c1121f'], fg: ['#588157', '#3a5a40', '#344e41', '#a3b18a'] }
    ];

    const currentPalette = palettes[plateIndex % palettes.length];
    const isPointInDigit = this.buildDigitMask(number);

    let dotsSVG = '';
    const numDots = 420;

    for (let i = 0; i < numDots; i++) {
      const angle = i * 2.39996;
      const dist = Math.sqrt(i / numDots) * (r - 12);
      const dotX = cx + dist * Math.cos(angle);
      const dotY = cy + dist * Math.sin(angle);
      const dotR = 4 + (Math.sin(i * 13) + 1) * 3;

      const isInDigit = isPointInDigit(dotX - cx, dotY - cy);
      const colorSet = isInDigit ? currentPalette.fg : currentPalette.bg;
      const dotColor = colorSet[i % colorSet.length];

      dotsSVG += `<circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${dotColor}" opacity="0.94"/>`;
    }

    return `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pseudoisochromatic Colour Plate Simulation ${plateIndex + 1}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#111827" stroke="#334155" stroke-width="3"/>
        ${dotsSVG}
      </svg>
    `;
  },

  buildDigitMask(numberStr) {
    try {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 94px "JetBrains Mono", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numberStr, size / 2, size / 2 + 4);
        const imgData = ctx.getImageData(0, 0, size, size).data;
        return (dx, dy) => {
          const px = Math.round((dx + 80) * (size / 160));
          const py = Math.round((dy + 80) * (size / 160));
          if (px < 0 || px >= size || py < 0 || py >= size) return false;
          return imgData[(py * size + px) * 4 + 3] > 100;
        };
      }
    } catch (e) {
      console.warn('Canvas rasterizer fallback:', e);
    }
    // Fallback hit-test for common numbers
    return (dx, dy) => Math.hypot(dx, dy) < 40;
  },

  submitAnswer(chosenOption) {
    const state = AppState.colour;
    const plate = state.plates[state.currentPlateIndex];
    if (!plate) return;

    const isCorrect = chosenOption === plate.normalAnswer;
    state.answers.push({
      plateIndex: state.currentPlateIndex,
      chosen: chosenOption,
      correct: isCorrect
    });

    if (isCorrect) state.score++;

    // Advance plate or finish directly
    if (state.currentPlateIndex < state.plates.length - 1) {
      state.currentPlateIndex++;
      this.renderPlate();
      this.speakCurrentPrompt();
    } else {
      const completeMsg = SPOKEN_TEXTS[AppState.language]?.colourComplete || SPOKEN_TEXTS.en.colourComplete;
      VoiceEngine.speak(completeMsg, () => {
        Navigation.completeScreening();
      });
    }
  },

  speakCurrentPrompt() {
    const speech = SPOKEN_TEXTS[AppState.language]?.colourPrompt || SPOKEN_TEXTS.en.colourPrompt;
    VoiceEngine.speak(speech);
  }
};

// ==========================================================================
// 8. OPTIONAL AUXILIARY SCREENING ACTIVITIES
// ==========================================================================
const OptionalTestsEngine = {
  runContrastTest() {
    Navigation.openModal('modalOptionalRunner');
    const title = document.getElementById('optionalRunnerTitle');
    const sub = document.getElementById('optionalRunnerSubtitle');
    const body = document.getElementById('optionalRunnerBody');

    if (title) title.textContent = 'Digital Low-Contrast Awareness Screening';
    if (sub) sub.textContent = 'Uncalibrated Screen-Based Contrast Activity (Informational Only)';

    if (body) {
      body.innerHTML = `
        <div class="text-center mb-3">
          <p>Read the letters across each line from top to bottom. Select the lowest line where you can still clearly identify the letters:</p>
          <p class="text-secondary" style="font-size:0.85rem;">Notice: Consumer displays differ in gamma and luminance. This activity cannot replace a clinical Pelli-Robson test conducted at calibrated 85 cd/m² luminance.</p>
        </div>
        <div style="background:#ffffff; color:#000000; padding:24px; border-radius:12px; font-family:'JetBrains Mono', monospace; text-align:center;">
          <div style="font-size:24px; font-weight:700; opacity:1.0; margin-bottom:12px;">V R S &bull; Line 1 (100% High Contrast)</div>
          <div style="font-size:24px; font-weight:700; opacity:0.65; margin-bottom:12px;">K D N &bull; Line 2 (65% Moderate)</div>
          <div style="font-size:24px; font-weight:700; opacity:0.35; margin-bottom:12px;">Z H O &bull; Line 3 (35% Low Contrast)</div>
          <div style="font-size:24px; font-weight:700; opacity:0.18; margin-bottom:12px;">C N E &bull; Line 4 (18% Faint)</div>
          <div style="font-size:24px; font-weight:700; opacity:0.08; margin-bottom:12px;">D B P &bull; Line 5 (8% Threshold)</div>
        </div>
        <div class="mt-4" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
          <button class="btn btn-secondary" id="btnContrastLine45">I can read Line 4 or 5</button>
          <button class="btn btn-secondary" id="btnContrastLine3">I can only read Line 3</button>
          <button class="btn btn-secondary" id="btnContrastLine12">I struggle below Line 2</button>
        </div>
      `;

      document.getElementById('btnContrastLine45')?.addEventListener('click', () => {
        OptionalTestsEngine.saveContrast('Able to resolve lines 4-5 (Display-dependent)');
      });
      document.getElementById('btnContrastLine3')?.addEventListener('click', () => {
        OptionalTestsEngine.saveContrast('Able to resolve line 3 (Display-dependent)');
      });
      document.getElementById('btnContrastLine12')?.addEventListener('click', () => {
        OptionalTestsEngine.saveContrast('Struggled below line 2 (Display-dependent)');
      });
    }
  },

  saveContrast(result) {
    AppState.optional.contrastResult = result;
    Navigation.closeModal('modalOptionalRunner');
    VoiceEngine.showToast(`Contrast observation recorded: ${result}`);
  },

  runAmslerTest() {
    Navigation.openModal('modalOptionalRunner');
    const title = document.getElementById('optionalRunnerTitle');
    const sub = document.getElementById('optionalRunnerSubtitle');
    const body = document.getElementById('optionalRunnerBody');

    if (title) title.textContent = 'Amsler Grid Distortion Self-Check';
    if (sub) sub.textContent = 'Screen-Based Metamorphopsia Check (Not a dilated clinical examination)';

    if (body) {
      body.innerHTML = `
        <div class="text-center mb-3">
          <p>Wear your reading glasses if you use them. Cover one eye and fix your gaze directly on the white center dot. Do not move your eye away from the dot.</p>
        </div>
        <div style="display:flex; justify-content:center; margin-bottom:20px;">
          <div style="width:280px; height:280px; background-color:#0f172a; background-image:linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px); background-size:20px 20px; border:2px solid #64748b; display:flex; align-items:center; justify-content:center; position:relative;">
            <div style="width:10px; height:10px; border-radius:50%; background:#ffffff; box-shadow:0 0 10px #ffffff;"></div>
          </div>
        </div>
        <div class="text-center mb-3">
          <strong>While looking at the center dot, do any lines look wavy, blurred, bent, or missing?</strong>
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button class="btn btn-primary" id="btnAmslerNormal">All lines appear straight and complete</button>
          <button class="btn btn-danger" id="btnAmslerWavy">Some lines appear wavy, bent, or missing</button>
        </div>
      `;

      document.getElementById('btnAmslerNormal')?.addEventListener('click', () => {
        OptionalTestsEngine.saveAmsler('Self-Report: All grid lines appear straight');
      });
      document.getElementById('btnAmslerWavy')?.addEventListener('click', () => {
        OptionalTestsEngine.saveAmsler('Self-Report: Wavy/bent lines noted (Follow-up recommended)');
      });
    }
  },

  saveAmsler(result) {
    AppState.optional.amslerResult = result;
    Navigation.closeModal('modalOptionalRunner');
    VoiceEngine.showToast(`Amsler Grid observation recorded`);
  },

  runPeripheralTest() {
    Navigation.openModal('modalOptionalRunner');
    const title = document.getElementById('optionalRunnerTitle');
    const sub = document.getElementById('optionalRunnerSubtitle');
    const body = document.getElementById('optionalRunnerBody');

    if (title) title.textContent = 'Peripheral Awareness Screen Activity';
    if (sub) sub.textContent = 'Informal Visual Awareness Activity (Not a clinical visual-field perimetry examination)';

    if (body) {
      body.innerHTML = `
        <div class="text-center mb-3">
          <p>Stare continuously at the blue plus symbol in the center. Side flashes will appear. Tap the flash as soon as your peripheral vision detects it.</p>
        </div>
        <div id="peripheralArena" style="width:100%; height:260px; background:var(--bg-card); border:2px solid var(--border-light); border-radius:12px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:crosshair;">
          <div style="font-size:32px; font-weight:800; color:var(--accent-blue); pointer-events:none;">+</div>
          <div id="stimulusDot" style="position:absolute; width:16px; height:16px; border-radius:50%; background:var(--accent-amber); box-shadow:0 0 14px var(--accent-amber); display:none;"></div>
        </div>
        <div class="text-center mt-3">
          <span id="peripheralScoreTracker">Targets detected: 0 / 4</span>
          <div class="mt-2">
            <button class="btn btn-primary btn-sm" id="btnStartPeripheralLoop">Begin Awareness Test</button>
          </div>
        </div>
      `;

      document.getElementById('btnStartPeripheralLoop')?.addEventListener('click', () => {
        let count = 0;
        const arena = document.getElementById('peripheralArena');
        const dot = document.getElementById('stimulusDot');
        const tracker = document.getElementById('peripheralScoreTracker');

        function showNext() {
          if (count >= 4) {
            OptionalTestsEngine.savePeripheral('Responsive (4/4 Detected)');
            return;
          }
          const posX = 15 + Math.random() * 70;
          const posY = 15 + Math.random() * 70;
          if (dot) {
            dot.style.left = `${posX}%`;
            dot.style.top = `${posY}%`;
            dot.style.display = 'block';
          }
        }

        dot?.addEventListener('click', () => {
          count++;
          if (tracker) tracker.textContent = `Targets detected: ${count} / 4`;
          dot.style.display = 'none';
          setTimeout(showNext, 700);
        });

        showNext();
      });
    }
  },

  savePeripheral(result) {
    AppState.optional.peripheralResult = result;
    Navigation.closeModal('modalOptionalRunner');
    VoiceEngine.showToast(`Peripheral screening recorded: ${result}`);
  }
};

// ==========================================================================
// 9. RESULTS & CLINICAL SUMMARY DASHBOARD
// ==========================================================================
const ResultsEngine = {
  calculateResults() {
    // Tumbling Scores & Sub-metrics Calculation
    const odTumblingAnswers = AppState.tumbling.odAnswers;
    const osTumblingAnswers = AppState.tumbling.osAnswers;
    const odTumblingCorrect = odTumblingAnswers.filter(a => a.correct).length;
    const osTumblingCorrect = osTumblingAnswers.filter(a => a.correct).length;

    const lastOdTumblingCorrect = [...odTumblingAnswers].reverse().find(a => a.correct);
    const lastOsTumblingCorrect = [...osTumblingAnswers].reverse().find(a => a.correct);

    const odTumbling = lastOdTumblingCorrect 
      ? lastOdTumblingCorrect.level 
      : (odTumblingAnswers.length > 0 ? '< 20/200' : 'Not Screened');
    const osTumbling = lastOsTumblingCorrect 
      ? lastOsTumblingCorrect.level 
      : (osTumblingAnswers.length > 0 ? '< 20/200' : 'Not Screened');

    AppState.tumbling.odScore = odTumbling;
    AppState.tumbling.osScore = osTumbling;

    // Alphabet Scores & Sub-metrics Calculation
    const odAlphabetAnswers = AppState.alphabet.odAnswers;
    const osAlphabetAnswers = AppState.alphabet.osAnswers;
    const odAlphabetCorrect = odAlphabetAnswers.filter(a => a.correct).length;
    const osAlphabetCorrect = osAlphabetAnswers.filter(a => a.correct).length;

    const lastOdAlphabetCorrect = [...odAlphabetAnswers].reverse().find(a => a.correct);
    const lastOsAlphabetCorrect = [...osAlphabetAnswers].reverse().find(a => a.correct);

    const odAlphabet = lastOdAlphabetCorrect 
      ? lastOdAlphabetCorrect.level 
      : (odAlphabetAnswers.length > 0 ? '< 20/100' : 'Not Screened');
    const osAlphabet = lastOsAlphabetCorrect 
      ? lastOsAlphabetCorrect.level 
      : (osAlphabetAnswers.length > 0 ? '< 20/100' : 'Not Screened');

    AppState.alphabet.odScore = odAlphabet;
    AppState.alphabet.osScore = osAlphabet;

    // logMAR calculations
    const odLogmarObj = AppState.alphabet.levels.find(l => l.snellen === odAlphabet);
    const osLogmarObj = AppState.alphabet.levels.find(l => l.snellen === osAlphabet);
    const logmarOD = odLogmarObj ? odLogmarObj.logMAR.toFixed(2) : (odAlphabet.includes('<') ? '> 1.00' : 'N/A');
    const logmarOS = osLogmarObj ? osLogmarObj.logMAR.toFixed(2) : (osAlphabet.includes('<') ? '> 1.00' : 'N/A');

    // Colour Score
    const colourScore = AppState.colour.score;

    // Update Dashboard UI Elements
    document.getElementById('resTumblingODScore').textContent = odTumbling;
    document.getElementById('resTumblingOSScore').textContent = osTumbling;
    document.getElementById('resAlphabetODScore').textContent = odAlphabet;
    document.getElementById('resAlphabetOSScore').textContent = osAlphabet;
    document.getElementById('resColourScore').textContent = `${colourScore} / ${AppState.colour.plates.length}`;

    // Update Detailed Card Sub-metrics
    const elTumblingODAcc = document.getElementById('resTumblingODAccuracy');
    const elTumblingODSmall = document.getElementById('resTumblingODSmallest');
    const elTumblingOSAcc = document.getElementById('resTumblingOSAccuracy');
    const elTumblingOSSmall = document.getElementById('resTumblingOSSmallest');

    if (elTumblingODAcc) elTumblingODAcc.textContent = `${odTumblingCorrect} / ${odTumblingAnswers.length || 6} correct`;
    if (elTumblingODSmall) elTumblingODSmall.textContent = lastOdTumblingCorrect ? lastOdTumblingCorrect.level : (odTumblingAnswers.length > 0 ? '< 20/200' : 'Not Screened');
    if (elTumblingOSAcc) elTumblingOSAcc.textContent = `${osTumblingCorrect} / ${osTumblingAnswers.length || 6} correct`;
    if (elTumblingOSSmall) elTumblingOSSmall.textContent = lastOsTumblingCorrect ? lastOsTumblingCorrect.level : (osTumblingAnswers.length > 0 ? '< 20/200' : 'Not Screened');

    const elAlphaODAcc = document.getElementById('resAlphabetODAccuracy');
    const elAlphaODLogmar = document.getElementById('resAlphabetODLogmar');
    const elAlphaOSAcc = document.getElementById('resAlphabetOSAccuracy');
    const elAlphaOSLogmar = document.getElementById('resAlphabetOSLogmar');

    if (elAlphaODAcc) elAlphaODAcc.textContent = `${odAlphabetCorrect} / ${odAlphabetAnswers.length || 6}`;
    if (elAlphaODLogmar) elAlphaODLogmar.textContent = logmarOD;
    if (elAlphaOSAcc) elAlphaOSAcc.textContent = `${osAlphabetCorrect} / ${osAlphabetAnswers.length || 6}`;
    if (elAlphaOSLogmar) elAlphaOSLogmar.textContent = logmarOS;

    const elColourPlates = document.getElementById('resColourPlatesIdentified');
    const elColourRG = document.getElementById('resColourRedGreen');
    if (elColourPlates) elColourPlates.textContent = `${colourScore} of ${AppState.colour.plates.length} identified`;
    if (elColourRG) elColourRG.textContent = colourScore >= 4 ? 'Consistent Discrimination (Screening)' : 'Screening Variation Observed';

    // Status Tags
    const tagTumblingOD = document.getElementById('resTumblingODTag');
    const tagTumblingOS = document.getElementById('resTumblingOSTag');
    const tagAlphaOD = document.getElementById('resAlphabetODTag');
    const tagAlphaOS = document.getElementById('resAlphabetOSTag');

    if (tagTumblingOD) {
      const isGood = odTumbling === '20/20' || odTumbling === '20/30';
      tagTumblingOD.textContent = isGood ? 'Expected Acuity' : (odTumbling === 'Not Screened' ? 'Not Screened' : 'Reduced Acuity');
      tagTumblingOD.className = `result-status-tag ${isGood ? 'tag-good' : (odTumbling === 'Not Screened' ? 'tag-neutral' : 'tag-warning')}`;
    }
    if (tagTumblingOS) {
      const isGood = osTumbling === '20/20' || osTumbling === '20/30';
      tagTumblingOS.textContent = isGood ? 'Expected Acuity' : (osTumbling === 'Not Screened' ? 'Not Screened' : 'Reduced Acuity');
      tagTumblingOS.className = `result-status-tag ${isGood ? 'tag-good' : (osTumbling === 'Not Screened' ? 'tag-neutral' : 'tag-warning')}`;
    }
    if (tagAlphaOD) {
      const isGood = odAlphabet === '20/20' || odAlphabet === '20/25';
      tagAlphaOD.textContent = isGood ? 'Expected Recognition' : (odAlphabet === 'Not Screened' ? 'Not Screened' : 'Reduced Acuity');
      tagAlphaOD.className = `result-status-tag ${isGood ? 'tag-good' : (odAlphabet === 'Not Screened' ? 'tag-neutral' : 'tag-warning')}`;
    }
    if (tagAlphaOS) {
      const isGood = osAlphabet === '20/20' || osAlphabet === '20/25';
      tagAlphaOS.textContent = isGood ? 'Expected Recognition' : (osAlphabet === 'Not Screened' ? 'Not Screened' : 'Reduced Acuity');
      tagAlphaOS.className = `result-status-tag ${isGood ? 'tag-good' : (osAlphabet === 'Not Screened' ? 'tag-neutral' : 'tag-warning')}`;
    }

    // Colour Vision interpretation
    const colourTag = document.getElementById('resColourTag');
    if (colourTag) {
      if (colourScore >= 4) {
        colourTag.textContent = 'Consistent Plate Recognition';
        colourTag.className = 'result-status-tag tag-good';
      } else {
        colourTag.textContent = 'Screening Variation Observed';
        colourTag.className = 'result-status-tag tag-warning';
      }
    }

    // Optional status (if DOM elements exist)
    const optScore = document.getElementById('resOptionalScore');
    const optTag = document.getElementById('resOptionalTag');
    const elAmsler = document.getElementById('resAmslerStatus');
    const elContrast = document.getElementById('resContrastStatus');
    const amslerVal = (AppState.optional && AppState.optional.amslerResult) || 'Not Taken';
    const contrastVal = (AppState.optional && AppState.optional.contrastResult) || 'Not Taken';

    if (elAmsler) {
      elAmsler.textContent = amslerVal.includes('Wavy') || amslerVal.includes('Metamorphopsia') 
        ? 'Distortion Noted on Screen' 
        : (amslerVal !== 'Not Taken' ? 'Straight Lines Reported' : 'Not Screened');
    }
    if (elContrast) {
      elContrast.textContent = contrastVal !== 'Not Taken' ? contrastVal : 'Not Screened';
    }

    if (optScore) optScore.textContent = (amslerVal !== 'Not Taken' || contrastVal !== 'Not Taken') ? 'Screened' : 'Not Screened';
    if (optTag) {
      const hasDistortion = amslerVal.includes('Wavy') || amslerVal.includes('Metamorphopsia');
      optTag.textContent = hasDistortion ? 'Distortion Self-Reported' : (amslerVal !== 'Not Taken' ? 'No Distortion Reported' : 'Not Screened');
      optTag.className = hasDistortion ? 'result-status-tag tag-alert' : (amslerVal !== 'Not Taken' ? 'result-status-tag tag-good' : 'result-status-tag tag-neutral');
    }

    // Overall Acuity Rating
    const overallScoreEl = document.getElementById('summaryAcuityScore');
    const summaryTextEl = document.getElementById('summaryExplanation');

    const hasTestedTumbling = odTumbling !== 'Not Screened' || osTumbling !== 'Not Screened';
    const isNormalOD = (odTumbling === '20/20' || odTumbling === '20/30') && (odAlphabet === '20/20' || odAlphabet === '20/25');
    const isNormalOS = (osTumbling === '20/20' || osTumbling === '20/30') && (osAlphabet === '20/20' || osAlphabet === '20/25');

    if (!hasTestedTumbling) {
      if (overallScoreEl) overallScoreEl.textContent = 'Screening Incomplete';
      if (summaryTextEl) {
        summaryTextEl.textContent = 'Visual acuity screening modules were not fully completed. Complete both the Right Eye (OD) and Left Eye (OS) tests for an informed preliminary observation.';
      }
    } else if (isNormalOD && isNormalOS) {
      if (overallScoreEl) overallScoreEl.textContent = 'Expected Screening Acuity Observed';
      if (summaryTextEl) {
        summaryTextEl.textContent = 'Monocular responses for both the Right Eye (OD) and Left Eye (OS) achieved expected preliminary resolution at the tested distance. Color plate simulation responses were consistent. This observation does not rule out asymptomatic refractive errors or ocular conditions; routine in-person eye examinations remain essential.';
      }
    } else {
      if (overallScoreEl) overallScoreEl.textContent = 'Preliminary Acuity Variation Observed';
      if (summaryTextEl) {
        summaryTextEl.textContent = `Preliminary responses suggest reduced visual resolution in one or both eyes under current screen conditions (Right Eye: ${odTumbling}, Left Eye: ${osTumbling}). As digital screenings depend on screen calibration and ambient lighting, an evaluation by an optometrist or ophthalmologist is recommended for clinical assessment.`;
      }
    }

    // Timestamp
    const timeEl = document.getElementById('resultsTimestamp');
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = `Screening performed on: ${now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }

    this.updatePrintableReport();
  },

  updatePrintableReport() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const sessionId = Math.floor(1000 + Math.random() * 9000);

    const printDate = document.getElementById('printDateString');
    const printSession = document.getElementById('printSessionId');
    const printLang = document.getElementById('printReportLang');

    if (printDate) printDate.textContent = `Date: ${dateStr}`;
    if (printSession) printSession.textContent = `${sessionId}`;
    if (printLang) printLang.textContent = `${AppState.language.toUpperCase()} (Screening)`;

    // Update Report Table Cells
    const elRptTumblingOD = document.getElementById('rptTumblingOD');
    const elRptTumblingOS = document.getElementById('rptTumblingOS');
    const elRptAlphabetOD = document.getElementById('rptAlphabetOD');
    const elRptAlphabetOS = document.getElementById('rptAlphabetOS');
    const elRptColourVal = document.getElementById('rptColourVal');
    const elRptAmslerVal = document.getElementById('rptAmslerVal');
    const elRptAuxVal = document.getElementById('rptAuxVal');

    if (elRptTumblingOD) elRptTumblingOD.textContent = AppState.tumbling.odScore || 'Not Screened';
    if (elRptTumblingOS) elRptTumblingOS.textContent = AppState.tumbling.osScore || 'Not Screened';
    if (elRptAlphabetOD) elRptAlphabetOD.textContent = AppState.alphabet.odScore || 'Not Screened';
    if (elRptAlphabetOS) elRptAlphabetOS.textContent = AppState.alphabet.osScore || 'Not Screened';
    if (elRptColourVal) elRptColourVal.textContent = `${AppState.colour.score} of ${AppState.colour.plates.length} identified (${AppState.colour.score >= 4 ? 'Consistent pattern recognition' : 'Screening variation noted'})`;
    if (elRptAmslerVal) elRptAmslerVal.textContent = (AppState.optional && AppState.optional.amslerResult !== 'Not Taken') ? AppState.optional.amslerResult : 'Not Screened';
    if (elRptAuxVal) elRptAuxVal.textContent = (AppState.optional && AppState.optional.contrastResult !== 'Not Taken') ? AppState.optional.contrastResult : 'Not Screened';

    // Summary Narrative
    const rptText = document.getElementById('rptSummaryText');
    if (rptText) {
      rptText.textContent = `Preliminary digital screening completed on ${dateStr}. Right Eye achieved ${AppState.tumbling.odScore} (Tumbling E) and ${AppState.alphabet.odScore} (Snellen). Left Eye achieved ${AppState.tumbling.osScore} and ${AppState.alphabet.osScore}. Colour perception score: ${AppState.colour.score}/${AppState.colour.plates.length}. This educational screening observation does not replace an official in-person dilated eye examination.`;
    }
  }
};

// ==========================================================================
// 10. INTERACTIVE 20-20-20 RULE TIMER
// ==========================================================================
const RuleTimer = {
  toggle() {
    if (AppState.timer.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    AppState.timer.isRunning = true;
    const btn = document.getElementById('btnStart20Timer');
    const btnText = document.getElementById('btnTimerText');
    if (btnText) btnText.textContent = 'Pause Timer';

    AppState.timer.intervalId = setInterval(() => {
      if (AppState.timer.remainingSeconds > 0) {
        AppState.timer.remainingSeconds--;
        this.updateDisplay();
      } else {
        this.triggerBreak();
      }
    }, 1000);
  },

  pause() {
    AppState.timer.isRunning = false;
    clearInterval(AppState.timer.intervalId);
    const btnText = document.getElementById('btnTimerText');
    if (btnText) btnText.textContent = 'Resume Timer';
  },

  reset() {
    this.pause();
    AppState.timer.remainingSeconds = 20 * 60;
    AppState.timer.isBreakMode = false;
    const label = document.getElementById('timerStateLabel');
    const btnText = document.getElementById('btnTimerText');
    if (label) label.textContent = 'Work Interval';
    if (btnText) btnText.textContent = 'Start 20m Timer';
    this.updateDisplay();
  },

  simulateBreak() {
    this.pause();
    AppState.timer.remainingSeconds = 20;
    AppState.timer.isBreakMode = true;
    const label = document.getElementById('timerStateLabel');
    if (label) label.textContent = 'Break Mode (Relax Eyes)';
    this.start();
    VoiceEngine.speak("20 second break started. Look at an object at least 20 feet away to relax your eyes.");
  },

  triggerBreak() {
    this.pause();
    if (!AppState.timer.isBreakMode) {
      // Switch from 20m work to 20s break
      AppState.timer.isBreakMode = true;
      AppState.timer.remainingSeconds = 20;
      const label = document.getElementById('timerStateLabel');
      if (label) label.textContent = 'Break Time! (Look 20ft away)';
      VoiceEngine.speak("Time for your 20-20-20 break. Look at an object 20 feet away for 20 seconds.");
      this.start();
    } else {
      // Break finished, reset to 20m
      VoiceEngine.speak("Break complete. Great job protecting your vision!");
      this.reset();
    }
  },

  updateDisplay() {
    const totalSecs = AppState.timer.remainingSeconds;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const displayEl = document.getElementById('timerMinutesSeconds');
    if (displayEl) {
      displayEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }
};

// ==========================================================================
// INITIALIZATION ON DOM READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  VoiceEngine.init();
  console.log('TEST YOUR EYES: Voice-Based Multilingual Vision Screening System Initialized.');
});
