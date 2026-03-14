export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface Technology {
  name: string;
  label: string;
  description: string;
  points: string[];
}

export const siteConfig = {
  name: 'Roman',
  title: 'WordPress Expert',
  tagline: 'Fast, reliable, and scalable websites.',
  description:
    'I help businesses build fast, reliable, and scalable websites using WordPress. With deep experience in custom development, performance optimization, and troubleshooting complex issues, I deliver solutions that work smoothly and are easy to manage.',
  email: 'hello@example.com',
  photo: '/images/roman.jpg',
};

export const services: Service[] = [
  {
    title: 'Custom WordPress Development',
    description:
      'Tailored WordPress solutions instead of bloated templates. Clean code, scalable architecture, and full control over functionality.',
    icon: '⌨',
  },
  {
    title: 'Theme Development',
    description:
      'Custom themes and integrations with tools like ACF to create flexible, easy-to-manage content systems.',
    icon: '◧',
  },
  {
    title: 'Custom Plugin Development',
    description:
      'Purpose-built WordPress plugins tailored to your exact needs — no bloat, no workarounds, just clean functionality that fits your workflow.',
    icon: '⬡',
  },
  {
    title: 'Custom Integrations',
    description:
      'Seamless connections between WordPress and third-party services, APIs, and tools to automate workflows and extend your site\'s capabilities.',
    icon: '⇄',
  },
  {
    title: 'Speed & Performance Optimization',
    description:
      'Faster load times, optimized images, caching setup, and performance audits to ensure your website runs efficiently.',
    icon: '▲',
  },
  {
    title: 'Bug Fixing & Troubleshooting',
    description:
      'White screens, plugin conflicts, error 500 issues, broken layouts — I quickly identify the cause and resolve it.',
    icon: '⟳',
  },
];

export const whyMe: string[] = [
  'Clean, maintainable code',
  'Strong debugging and problem-solving skills',
  'Focus on performance and stability',
  'Clear communication and reliable delivery',
  'Experience with complex WordPress setups',
];

export const technologies: Technology[] = [
  {
    name: 'WordPress',
    label: 'WP',
    description: 'My primary platform. I work with WordPress at a deep level — beyond themes and plugins, down to hooks, filters, and core internals.',
    points: [
      'Custom post types, taxonomies, and meta',
      'Advanced hook & filter architecture',
      'Multisite network setup and management',
      'WooCommerce customization and extensions',
    ],
  },
  {
    name: 'PHP',
    label: 'PHP',
    description: 'The language WordPress is built on. I write clean, modern PHP — no spaghetti code, no copy-paste logic.',
    points: [
      'OOP patterns: classes, interfaces, traits',
      'Custom plugin architecture from scratch',
      'Database queries with wpdb and raw SQL',
      'REST endpoint callbacks and middleware',
    ],
  },
  {
    name: 'JavaScript',
    label: 'JS',
    description: 'Vanilla JS for frontend interactivity and Node.js tooling. No framework overhead where it isn\'t needed.',
    points: [
      'DOM manipulation and event handling',
      'Fetch API and async/await patterns',
      'WordPress admin UI enhancements',
      'Build tooling with Webpack and Vite',
    ],
  },
  {
    name: 'SCSS',
    label: 'SCSS',
    description: 'Structured, maintainable stylesheets. I write SCSS that scales with the project and doesn\'t fight the browser.',
    points: [
      'Component-scoped styles and BEM conventions',
      'Design token systems with CSS custom properties',
      'Responsive layouts with modern CSS (grid, clamp)',
      'Theme customization without !important hacks',
    ],
  },
  {
    name: 'HTML5',
    label: 'HTML',
    description: 'Semantic, accessible markup that search engines and screen readers can actually parse.',
    points: [
      'Semantic elements for SEO and accessibility',
      'ARIA roles and keyboard navigation',
      'Structured data with JSON-LD',
      'Performance: lazy loading, preload hints',
    ],
  },
  {
    name: 'ACF',
    label: 'ACF',
    description: 'Advanced Custom Fields is my go-to for flexible content management — from simple fields to complex repeater layouts.',
    points: [
      'Custom field groups for any post type',
      'Flexible content and repeater fields',
      'ACF blocks as an alternative to full Gutenberg',
      'Programmatic field registration (no UI export needed)',
    ],
  },
  {
    name: 'WPML',
    label: 'WPML',
    description: 'Multilingual WordPress sites done right. I\'ve handled complex WPML setups across large content libraries.',
    points: [
      'Full site translation setup and configuration',
      'Programmatic string registration for themes and plugins',
      'Language switcher customization',
      'Troubleshooting WPML conflicts with custom code',
    ],
  },
  {
    name: 'REST API',
    label: 'API',
    description: 'WordPress as a headless backend or API provider. I build custom endpoints and secure them properly.',
    points: [
      'Custom REST routes and controllers',
      'Authentication: nonces, application passwords, JWT',
      'Exposing custom post types and meta via API',
      'Consuming third-party APIs from WordPress',
    ],
  },
  {
    name: 'Git',
    label: 'Git',
    description: 'Version control as a professional discipline — branching strategies, meaningful commits, and safe deployments.',
    points: [
      'Feature branching and pull request workflows',
      'Git hooks for code quality enforcement',
      'Deployment pipelines with GitHub Actions',
      'Managing WordPress codebases with .gitignore best practices',
    ],
  },
];
