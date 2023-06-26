module.exports = {
  content: [
    './_includes/**/*.{html,md,js}',
    './_layouts/**/*.{html,md,js}',
    './_*/**/*.{html,md,js}',
    '!./_site/**/*.{html,md,js}',
    './*.{html,md,js}'
  ],
  theme: {
    extend: {
    },
    container: {
      center: true,
      padding: '1rem',
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      square: 'square',
      roman: 'upper-roman',
    },
    colors: {
      'white': '#ffffff',
      'black': '#000000',
      'sage': {
        DEFAULT: '#707862',
        '50': '#F7F8F5',
        '100': '#E8EAE5',
        '200': '#e3e8dd',
        '300': '#ADB3A2',
        '400': '#8F9780',
        '500': '#707862',
        '600': '#5B6150',
        '700': '#464B3D',
        '800': '#31352B',
        '900': '#1C1E19' },
      'emye': {
        DEFAULT: '#E6E1DC',
        'terracotta': '#BE8C7D',
        'dustyblue': '#C3CDD7', 
      },
      'dfm': {
        DEFAULT: '#004344',
        'peach': '#fac8aa',
        'mint': '#8cdcb4', 
        'rose': '#e6b9b4',
      },
      'waves': {
        DEFAULT: '#6B8394',
        'dark': '#242C36',
      },      
      'camino': {
        DEFAULT: '#d8cfcf',
        'blue': '#c0ccd8',
        'dark': '#9aa3ac',
      },
      'galeria': {
        DEFAULT: '#D2D6EF',
        'blue': '#C3E6F5',
      },  
      'rdl': {
        DEFAULT: '#C8DCEB',
        'darkblue': '#1E375F',
        'orange': '#FF641E',
      },        
      'graphit': {
        DEFAULT: '#444444',
        '50': '#A0A0A0',
        '100': '#969696',
        '200': '#e3e8dd',
        '300': '#6D6D6D',
        '400': '#585858',
        '500': '#444444',
        '600': '#3A3A3A',
        '700': '#303030',
        '800': '#252525',
        '900': '#1B1B1B'
      },
    },
    fontFamily: {
      sans: ['Montserrat', 'sans-serif'],
      serif: ['EB Garamond', 'serif'],
      display: ['canelathin', 'serif'],
      handwritten: ['Anderson', 'serif'],
    },
  },
  plugins: [],

}


