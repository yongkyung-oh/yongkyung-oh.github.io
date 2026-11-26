import { profileUrl } from './profile-links.ts';

export const recognitionLinks: Partial<Record<string, { label: string; url: string }[]>> = {
  'kiie-2026-selection': [
    { label: 'KIIE award announcement', url: 'https://kiie.org/board/board.asp?Action=content&B_CATE=BBS1&GotoPage=1&b_code=10391' },
    { label: 'Pusan National University news', url: 'https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1512431&mCode=MN109&mode=view' },
  ],
};

export const editorial = {
  affiliation: { expectedOfficialMajor: 'Data Science Major' },
  lab: { url: profileUrl('lab') },
  cv: { url: profileUrl('cv') },
  social: { linkedin: profileUrl('linkedin') },
  description: 'YongKyung Oh, Assistant Professor at Pusan National University.',
  biography: "Dr. YongKyung Oh is an Assistant Professor in the Data Science Major, School of BioMedical Convergence Engineering, Pusan National University. His research interests span AI for Science, industrial AI and decision-making, evidence-centered AI, and continuous-time modeling. He combines machine learning, scientific knowledge, and simulation to study complex systems, with particular attention to model validity and uncertainty. His work aims to advance scientific discovery and support informed decision-making.\n\n\nHe previously conducted postdoctoral research at the University of California, Los Angeles (UCLA), from 2023 to 2026, and at the Ulsan National Institute of Science and Technology (UNIST). His earlier research experience includes General Motors (GM) and Carnegie Mellon University (CMU). He earned a B.Sc. in Physics, a Master in Technology and Innovation Management, and a Ph.D. in Industrial Engineering, all from UNIST.\n\n\nHis recent work includes a sole-authored ICML 2026 position paper on evidence standards. He is scheduled to receive the Wooheon early-career researcher award from the Korean Institute of Industrial Engineers (KIIE). His other distinctions include the ICLR 2024 Spotlight, the CHIL 2025 Best Paper Award, and a nomination for the 2025 UCLA Chancellor’s Award for Postdoctoral Research. His research and training have been supported by the National Research Foundation of Korea, KHIDI, IITP, NVIDIA, and Google.",
  uclaResearchNote: 'Contributed to clinical and wearable time series research with the UCLA Depression Grand Challenge, September 2023–August 2026.',
  fundingGroups: [
    { title: 'Research grants & fellowships', ids: ['nrf'] },
    { title: 'Computing & research tools', ids: ['openai-academic-researchers', 'kisti-hangang-allocation', 'google-tpu-research-cloud', 'nvidia'] },
    { title: 'Research training', ids: ['khidi', 'iitp'] },
  ],
  fundingDetails: {
    'kisti-hangang-allocation': {
      title: 'HANGANG R&D Innovation Program (Exploratory Research)',
      detail: 'Principal Investigator, Pusan National University · In-kind computing support',
    },
    'google-tpu-research-cloud': {
      title: 'TPU Research Cloud',
      detail: 'Principal Investigator, Pusan National University · In-kind access to Cloud TPUs',
    },
    nvidia: {
      title: 'Academic Grant Program',
      detail: 'Lead Scientist on the project team · UCLA project led by Alex A. T. Bui',
    },
    nrf: { detail: 'Principal Investigator, hosted at UCLA' },
    khidi: { detail: 'Visiting Postdoctoral Researcher, UNIST–UCLA' },
    iitp: { detail: 'Trainee, Carnegie Mellon University' },
  },
  tutorials: [
    {
      id: 'ksc-2026',
      venue: 'KIISE KSC 2026',
      title: 'A Practical Guide to Neural Differential Equations',
      date: 'Dec 23, 2026',
      detail: 'Scheduled · Tutorial speaker, Pusan National University',
      links: [
        { label: 'KSC program', url: 'https://www.kiise.or.kr/conference/main/getContent.do?CC=KSC&CS=2026&content_no=2596&PARENT_ID=011100' },
        { label: 'Tutorial materials', url: 'https://nde-for-ts.github.io/ksc-2026/' },
      ],
    },
    {
      id: 'cikm-2025',
      venue: 'ACM CIKM 2025',
      title: 'Neural Differential Equations for Continuous-Time Analysis',
      date: 'Nov 10, 2025',
      detail: 'Co-organizer and presenter, UCLA · With Dong-Young Lim and Sungil Kim',
      links: [
        { label: 'CIKM program', url: 'https://cikm2025.org/program/tutorials' },
        { label: 'Tutorial materials', url: 'https://nde-for-ts.github.io/cikm-2025/' },
      ],
    },
  ],
  research: [
    { id: 'ai-for-science', title: 'AI for Science', description: 'He combines machine learning with scientific knowledge and simulation to discover the mechanisms behind complex systems.' },
    { id: 'industrial-ai-and-decision-making', title: 'Industrial AI & Decision-Making', description: 'He uses machine learning, optimization, and simulation to support design and operational decisions in manufacturing, logistics, and service systems.' },
    { id: 'evidence-centered-ai', title: 'Evidence-Centered AI', description: 'He develops principles for judging AI claims by the comparisons, uncertainty analysis, and reproducible evidence that support them.' },
    { id: 'continuous-time-modeling', title: 'Continuous-Time Modeling', description: 'He models continuous dynamics from irregular observations with neural differential equations and accounts for stability and uncertainty.' },
  ],
};
