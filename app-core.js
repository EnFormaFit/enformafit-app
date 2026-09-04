// ── STATE ──
const APP_VER='v8.4';
const ST={
  u:{nom:'',init:'',plan:'',semana:1,semTotal:12,tipo:'programa',
     altura:175,peso:80,dob:'',objetivo:75,lesiones:'',
     inicioBloque:'2026-06-13'},
  p:{macro:{kcal:2000,p:160,c:200,g:65},superavit:false,def:-500},
  pasos:{obj:10000},
  pesos:[],
  objPeso:0,pesoInicial:0,bajanSem:0,
  racha:14,adh:0.81,
  menu:{},menuGuardado:{},
  ejStates:{},histEnt:{"Sentadilla Barra Alta": {"semanas": {"1": {"series": [{"kg": "60.0", "reps": "6", "done": true}, {"kg": "60.0", "reps": "6", "done": true}, {"kg": "60.0", "reps": "6", "done": true}]}, "2": {"series": [{"kg": "62.5", "reps": "6", "done": true}, {"kg": "62.5", "reps": "6", "done": true}, {"kg": "62.5", "reps": "6", "done": true}]}, "3": {"series": [{"kg": "65.0", "reps": "6", "done": true}, {"kg": "65.0", "reps": "6", "done": true}, {"kg": "65.0", "reps": "6", "done": true}]}, "4": {"series": [{"kg": "67.5", "reps": "6", "done": true}, {"kg": "67.5", "reps": "6", "done": true}, {"kg": "67.5", "reps": "6", "done": true}]}, "5": {"series": [{"kg": "70.0", "reps": "6", "done": true}, {"kg": "70.0", "reps": "6", "done": true}, {"kg": "70.0", "reps": "6", "done": true}]}, "6": {"series": [{"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}]}, "Sentadilla Búlgara con Mancuerna": {"semanas": {"1": {"series": [{"kg": "60.0", "reps": "12", "done": true}, {"kg": "60.0", "reps": "12", "done": true}, {"kg": "60.0", "reps": "12", "done": true}]}, "2": {"series": [{"kg": "62.5", "reps": "12", "done": true}, {"kg": "62.5", "reps": "12", "done": true}, {"kg": "62.5", "reps": "12", "done": true}]}, "3": {"series": [{"kg": "65.0", "reps": "12", "done": true}, {"kg": "65.0", "reps": "12", "done": true}, {"kg": "65.0", "reps": "12", "done": true}]}, "4": {"series": [{"kg": "67.5", "reps": "12", "done": true}, {"kg": "67.5", "reps": "12", "done": true}, {"kg": "67.5", "reps": "12", "done": true}]}, "5": {"series": [{"kg": "70.0", "reps": "12", "done": true}, {"kg": "70.0", "reps": "12", "done": true}, {"kg": "70.0", "reps": "12", "done": true}]}, "6": {"series": [{"kg": "72.5", "reps": "12", "done": true}, {"kg": "72.5", "reps": "12", "done": true}, {"kg": "72.5", "reps": "12", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "72.5", "reps": "12", "done": true}, {"kg": "72.5", "reps": "12", "done": true}, {"kg": "72.5", "reps": "12", "done": true}]}, "Curl de Isquio en Máquina tumbado": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Crunch Abdominal": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "22", "done": true}, {"kg": "30.0", "reps": "22", "done": true}, {"kg": "30.0", "reps": "22", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "22", "done": true}, {"kg": "32.5", "reps": "22", "done": true}, {"kg": "32.5", "reps": "22", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "22", "done": true}, {"kg": "35.0", "reps": "22", "done": true}, {"kg": "35.0", "reps": "22", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "22", "done": true}, {"kg": "37.5", "reps": "22", "done": true}, {"kg": "37.5", "reps": "22", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "22", "done": true}, {"kg": "40.0", "reps": "22", "done": true}, {"kg": "40.0", "reps": "22", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "22", "done": true}, {"kg": "42.5", "reps": "22", "done": true}, {"kg": "42.5", "reps": "22", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "22", "done": true}, {"kg": "42.5", "reps": "22", "done": true}, {"kg": "42.5", "reps": "22", "done": true}]}, "Elevaciones laterales en máquina": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Press Banca Inclinado con Mancuernas": {"semanas": {"1": {"series": [{"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}]}, "2": {"series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}, "3": {"series": [{"kg": "45.0", "reps": "12", "done": true}, {"kg": "45.0", "reps": "12", "done": true}, {"kg": "45.0", "reps": "12", "done": true}]}, "4": {"series": [{"kg": "47.5", "reps": "12", "done": true}, {"kg": "47.5", "reps": "12", "done": true}, {"kg": "47.5", "reps": "12", "done": true}]}, "5": {"series": [{"kg": "50.0", "reps": "12", "done": true}, {"kg": "50.0", "reps": "12", "done": true}, {"kg": "50.0", "reps": "12", "done": true}]}, "6": {"series": [{"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}]}, "Dominadas Pronas en Máquina asistida": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "12", "done": true}, {"kg": "30.0", "reps": "12", "done": true}, {"kg": "30.0", "reps": "12", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "12", "done": true}, {"kg": "32.5", "reps": "12", "done": true}, {"kg": "32.5", "reps": "12", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "12", "done": true}, {"kg": "35.0", "reps": "12", "done": true}, {"kg": "35.0", "reps": "12", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "12", "done": true}, {"kg": "37.5", "reps": "12", "done": true}, {"kg": "37.5", "reps": "12", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}, "Press Militar en Máquina": {"semanas": {"1": {"series": [{"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "45.0", "reps": "16", "done": true}, {"kg": "45.0", "reps": "16", "done": true}, {"kg": "45.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "47.5", "reps": "16", "done": true}, {"kg": "47.5", "reps": "16", "done": true}, {"kg": "47.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "50.0", "reps": "16", "done": true}, {"kg": "50.0", "reps": "16", "done": true}, {"kg": "50.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "52.5", "reps": "16", "done": true}, {"kg": "52.5", "reps": "16", "done": true}, {"kg": "52.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "52.5", "reps": "16", "done": true}, {"kg": "52.5", "reps": "16", "done": true}, {"kg": "52.5", "reps": "16", "done": true}]}, "Remo Bilateral con Mancuernas": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "14", "done": true}, {"kg": "30.0", "reps": "14", "done": true}, {"kg": "30.0", "reps": "14", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "14", "done": true}, {"kg": "32.5", "reps": "14", "done": true}, {"kg": "32.5", "reps": "14", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "14", "done": true}, {"kg": "35.0", "reps": "14", "done": true}, {"kg": "35.0", "reps": "14", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "14", "done": true}, {"kg": "37.5", "reps": "14", "done": true}, {"kg": "37.5", "reps": "14", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "14", "done": true}, {"kg": "40.0", "reps": "14", "done": true}, {"kg": "40.0", "reps": "14", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "14", "done": true}, {"kg": "42.5", "reps": "14", "done": true}, {"kg": "42.5", "reps": "14", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "14", "done": true}, {"kg": "42.5", "reps": "14", "done": true}, {"kg": "42.5", "reps": "14", "done": true}]}, "Curl de Bíceps en Polea": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Extensión de Tríceps Bilateral en Polea": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}, "Peso Muerto Convencional": {"semanas": {"1": {"series": [{"kg": "60.0", "reps": "6", "done": true}, {"kg": "60.0", "reps": "6", "done": true}, {"kg": "60.0", "reps": "6", "done": true}]}, "2": {"series": [{"kg": "62.5", "reps": "6", "done": true}, {"kg": "62.5", "reps": "6", "done": true}, {"kg": "62.5", "reps": "6", "done": true}]}, "3": {"series": [{"kg": "65.0", "reps": "6", "done": true}, {"kg": "65.0", "reps": "6", "done": true}, {"kg": "65.0", "reps": "6", "done": true}]}, "4": {"series": [{"kg": "67.5", "reps": "6", "done": true}, {"kg": "67.5", "reps": "6", "done": true}, {"kg": "67.5", "reps": "6", "done": true}]}, "5": {"series": [{"kg": "70.0", "reps": "6", "done": true}, {"kg": "70.0", "reps": "6", "done": true}, {"kg": "70.0", "reps": "6", "done": true}]}, "6": {"series": [{"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}, {"kg": "72.5", "reps": "6", "done": true}]}, "Prensa de Pierna Unilateral": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "12", "done": true}, {"kg": "30.0", "reps": "12", "done": true}, {"kg": "30.0", "reps": "12", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "12", "done": true}, {"kg": "32.5", "reps": "12", "done": true}, {"kg": "32.5", "reps": "12", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "12", "done": true}, {"kg": "35.0", "reps": "12", "done": true}, {"kg": "35.0", "reps": "12", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "12", "done": true}, {"kg": "37.5", "reps": "12", "done": true}, {"kg": "37.5", "reps": "12", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}, "Aducción en Máquina": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}, "Elevaciones Laterales con Mancuerna": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Elevaciones de Piernas en Barra": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Press Banca con Barra con agarre ancho": {"semanas": {"1": {"series": [{"kg": "40.0", "reps": "6", "done": true}, {"kg": "40.0", "reps": "6", "done": true}, {"kg": "40.0", "reps": "6", "done": true}, {"kg": "40.0", "reps": "6", "done": true}]}, "2": {"series": [{"kg": "42.5", "reps": "6", "done": true}, {"kg": "42.5", "reps": "6", "done": true}, {"kg": "42.5", "reps": "6", "done": true}, {"kg": "42.5", "reps": "6", "done": true}]}, "3": {"series": [{"kg": "45.0", "reps": "6", "done": true}, {"kg": "45.0", "reps": "6", "done": true}, {"kg": "45.0", "reps": "6", "done": true}, {"kg": "45.0", "reps": "6", "done": true}]}, "4": {"series": [{"kg": "47.5", "reps": "6", "done": true}, {"kg": "47.5", "reps": "6", "done": true}, {"kg": "47.5", "reps": "6", "done": true}, {"kg": "47.5", "reps": "6", "done": true}]}, "5": {"series": [{"kg": "50.0", "reps": "6", "done": true}, {"kg": "50.0", "reps": "6", "done": true}, {"kg": "50.0", "reps": "6", "done": true}, {"kg": "50.0", "reps": "6", "done": true}]}, "6": {"series": [{"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}, {"kg": "52.5", "reps": "6", "done": true}]}, "Jalón Neutro en Polea": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}, "Press Banca en Máquina": {"semanas": {"1": {"series": [{"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}, {"kg": "40.0", "reps": "12", "done": true}]}, "2": {"series": [{"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}, {"kg": "42.5", "reps": "12", "done": true}]}, "3": {"series": [{"kg": "45.0", "reps": "12", "done": true}, {"kg": "45.0", "reps": "12", "done": true}, {"kg": "45.0", "reps": "12", "done": true}]}, "4": {"series": [{"kg": "47.5", "reps": "12", "done": true}, {"kg": "47.5", "reps": "12", "done": true}, {"kg": "47.5", "reps": "12", "done": true}]}, "5": {"series": [{"kg": "50.0", "reps": "12", "done": true}, {"kg": "50.0", "reps": "12", "done": true}, {"kg": "50.0", "reps": "12", "done": true}]}, "6": {"series": [{"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}, {"kg": "52.5", "reps": "12", "done": true}]}, "Curl de Bíceps en Banco Scott con Barra Z": {"semanas": {"1": {"series": [{"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}, {"kg": "20.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}, {"kg": "22.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}, {"kg": "25.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}, {"kg": "27.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "Extensión de Tríceps con Mancuerna Overhead sentado": {"semanas": {"1": {"series": [{"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}, {"kg": "30.0", "reps": "16", "done": true}]}, "2": {"series": [{"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}, {"kg": "32.5", "reps": "16", "done": true}]}, "3": {"series": [{"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}, {"kg": "35.0", "reps": "16", "done": true}]}, "4": {"series": [{"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}, {"kg": "37.5", "reps": "16", "done": true}]}, "5": {"series": [{"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}, {"kg": "40.0", "reps": "16", "done": true}]}, "6": {"series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}}, "fecha": "2026-07-18", "series": [{"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}, {"kg": "42.5", "reps": "16", "done": true}]}},
  rev:{done:false,fotos:{},medidas:{},preguntas:{},step:0},
  revHistorial:{},medidasIni:{},
  ci:{done:false,diasEnt:0,diasNut:0,diasPasos:0,como:'',orgullo:'',compromiso:'',sensaciones:'',adh:0,open:false},
  nutTab:'menu',nutDay:0,nutEditing:false,
  pesosOpen:false,medidasOpen:false,fotosOpen:false,
  perfilEditing:false,
  copyTargets:[],copyFrom:-1,
  listaCheck:{},
  revHistorial:{},
  _editandoRevSem:null,
};

// ── PERSIST ──

function fmtFechaApp(f){
  if(!f)return'—';
  if(f.includes('/'))return f;
  const p=f.split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:f;
}
function save(){try{localStorage.setItem('ef8',JSON.stringify({
  _v:'v2',
  menu:ST.menu,menuGuardado:ST.menuGuardado,pesos:ST.pesos,
  rev:ST.rev,revHistorial:ST.revHistorial,medidasIni:ST.medidasIni,
  ci:ST.ci,ejStates:ST.ejStates,histEnt:ST.histEnt,
  nutTab:ST.nutTab,nutDay:ST.nutDay,pesosOpen:ST.pesosOpen,
  fotosOpen:ST.fotosOpen,listaCheck:ST.listaCheck,
  u_lesiones:ST.u.lesiones,u_dob:ST.u.dob,
}))}catch(e){}}

function load(){if(_isPreview)return; // skip localStorage for panel preview sessions
try{
  const ver=localStorage.getItem('ef8_ver');
  if(ver!==APP_VER){localStorage.removeItem('ef8');localStorage.setItem('ef8_ver',APP_VER);return;}
  const d=JSON.parse(localStorage.getItem('ef8')||'{}');
  // v2: menu structure changed — discard old cached menu to force fresh load
  const CACHE_VER='v2';
  if(d._v===CACHE_VER){
    if(d.menu)ST.menu=d.menu;
    if(d.menuGuardado)ST.menuGuardado=d.menuGuardado;
  } else {
    // Clear stale cache — menu will reload from BD
    delete d.menu; delete d.menuGuardado;
  }
  if(d.pesos&&d.pesos.length)ST.pesos=d.pesos;
  if(d.rev)Object.assign(ST.rev,d.rev);
  if(d.revHistorial)ST.revHistorial=d.revHistorial;
  if(d._editandoRevSem!=null)ST._editandoRevSem=d._editandoRevSem;
  if(d.revHistorial)ST.revHistorial=d.revHistorial;
  if(d.medidasIni)ST.medidasIni=d.medidasIni;
  if(d.ci)Object.assign(ST.ci,d.ci);
  if(d.ejStates)ST.ejStates=d.ejStates;
  if(d.histEnt)Object.assign(ST.histEnt,d.histEnt);
  if(d.nutTab)ST.nutTab=d.nutTab;
  if(d.nutDay!==undefined)ST.nutDay=d.nutDay;
  if(d.pesosOpen!==undefined)ST.pesosOpen=d.pesosOpen;
  if(d.fotosOpen!==undefined)ST.fotosOpen=d.fotosOpen;
  if(d.listaCheck)ST.listaCheck=d.listaCheck;
  if(d.u_lesiones!==undefined)ST.u.lesiones=d.u_lesiones;
  if(d.u_dob)ST.u.dob=d.u_dob;
}catch(e){}}

// ── NAV ──
let SEC='inicio';
const TITLES={inicio:'Inicio',nutricion:'Nutrición',entreno:'Entreno',progreso:'Progreso',revision:'Revisión',perfil:'Perfil'};
function S(s){
  SEC=s;
  if(s==='progreso'&&_tk&&(!ST.revHistorial||!ST.revHistorial[0])){
    api('GET','/api/entreno/revision/0').then(function(d){if(d){if(!ST.revHistorial)ST.revHistorial={};ST.revHistorial[0]=d;render();}}).catch(function(){});
  }
  document.getElementById('st').textContent=TITLES[s]||s;
  ['ni','nn','ne','np','nr'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});
  const nm={inicio:'ni',nutricion:'nn',entreno:'ne',progreso:'np',revision:'nr'};
  if(nm[s])document.getElementById(nm[s])?.classList.add('on');
  render();
}
function render(){
  const ct=document.getElementById('ct');
  if(!ct)return;
  const fns={inicio:renderInicio,nutricion:renderNutricion,entreno:renderEntreno,progreso:renderProgreso,revision:renderRevision,perfil:renderPerfil};
  ct.innerHTML=(fns[SEC]||renderInicio)();
  ct.scrollTop=0;
}

// ── LOGIN ──
// ── API LAYER ──
const API='https://enformafit-backend-production.up.railway.app';
let _tk=localStorage.getItem('ef_tk')||null;
let _isPreview=false;

async function api(method,path,body){
  const opts={method,headers:{'Content-Type':'application/json'}};
  if(_tk)opts.headers['Authorization']='Bearer '+_tk;
  if(body)opts.body=JSON.stringify(body);
  const r=await fetch(API+path,opts);
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||String(r.status));
  return d;
}

async function doLogin(){
  const e=document.getElementById('le').value.trim();
  const p=document.getElementById('lp').value;
  const errEl=document.getElementById('lerr');
  if(!e||!p){errEl.textContent='Rellena email y contraseña';errEl.style.display='block';return;}
  errEl.style.display='none';
  const btn=document.querySelector('.lbtn');
  if(btn)btn.textContent='Entrando...';
  try{
    const data=await api('POST','/api/auth/login',{email:e,password:p});
    _tk=data.token;
    localStorage.setItem('ef_tk',_tk);
    localStorage.setItem('ef_role',data.role||'cliente');
    await loadClienteData();
    showApp();
  }catch(err){
    errEl.textContent=err.message.includes('Credenciales')||err.message==='401'?'Email o contraseña incorrectos':err.message;
    errEl.style.display='block';
    if(btn)btn.textContent='Entrar →';
  }
}


// ── Construir DIAS desde el plan del entrenador ─────────────────────────────
// DIAS[0..6] donde 0=lunes, 1=martes, ..., 6=domingo
// Usa rutina_semanas[semana] si hay override, si no rutina_base
function buildDIAS(semana) {
  const NOMBRES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const base = ST.p.rutinaDias || {};  // rutina_base (claves "0".."6" o "LUNES" etc.)
  const semanas = ST.p.rutinaSemanas || {};
  const semData = semanas[semana] || semanas[String(semana)] || base;

  var trainCount = 0;
  for (var i = 0; i < 7; i++) {
    var ejes = semData[i] || semData[String(i)] || [];
    var isRest = !ejes || ejes.length === 0;
    if (!isRest) trainCount++;
    DIAS[i] = {
      cod: NOMBRES[i].toUpperCase().replace('É','E').replace('Í','I').replace('Á','A'),
      nom: NOMBRES[i],
      tipo: isRest ? 'Descanso' : 'Entreno',
      rest: isRest,
      ejercicios: isRest ? [] : ejes.map(function(e) {
        return {
          nom: e.nom || '',
          sets: e.sets || 3,
          reps: String(e.reps || '8-10'),
          rir: e.rir !== undefined ? e.rir : 2,
          rest: e.rest || 120,
          url: e.url || '',
          acl: e.acl || '',
          bw: e.bw || false
        };
      })
    };
  }
  // Assign training numbers
  var n = 0;
  for (var j = 0; j < 7; j++) {
    if (!DIAS[j].rest) { n++; DIAS[j].tipo = 'Entreno ' + n; }
  }
}


// ── Auto-guardar serie al cambiar un campo ────────────────────────────────────
function autoGuardarSerie(di, ei, si) {
  var ej = DIAS[di] && DIAS[di].ejercicios ? DIAS[di].ejercicios[ei] : null;
  if (!ej) return;
  var key = di + '_' + ei;
  var st = ST.ejStates && ST.ejStates[key];
  if (!st || !st.series || !st.series[si]) return;
  var s = st.series[si];
  var bloque_id = ST.p.bloqueId || '';
  var semana = ST.semVer || ST.u.semana || 1;

  // Save to backend
  clearTimeout(window['_serSave_' + key + '_' + si]);
  window['_serSave_' + key + '_' + si] = setTimeout(function() {
    api('POST', '/api/entreno/registrar-serie', {
      bloque_id: bloque_id,
      semana: semana,
      dia: di,
      ejercicio: ej.nom,
      serie: si + 1,
      kg: parseFloat(s.kg) || 0,
      reps_reales: parseInt(s.repsH) || 0,
      rir_real: s.rir !== undefined ? s.rir : (ej.rir || 2)
    }).catch(function(e) { console.warn('[Serie]', e.message); });
  }, 800);
}

// ── Cargar historial desde BD ─────────────────────────────────────────────────
function cargarHistorial() {
  api('GET', '/api/entreno/mi-historial').then(function(rows) {
    if (!rows || !rows.length) return;
    if (!ST.histEnt) ST.histEnt = {};
    var semActual = ST.u.semana || 1;
    var semAnt = semActual - 1;
    rows.forEach(function(r) {
      var nom = r.ejercicio;
      if (!ST.histEnt[nom]) ST.histEnt[nom] = { semanas: {} };
      var semKey = String(r.semana);
      if (!ST.histEnt[nom].semanas[semKey]) ST.histEnt[nom].semanas[semKey] = { series: [] };
      // series indexed by serie number (1-based)
      while (ST.histEnt[nom].semanas[semKey].series.length < r.serie) {
        ST.histEnt[nom].semanas[semKey].series.push({ kg: '', reps: '', done: false });
      }
      ST.histEnt[nom].semanas[semKey].series[r.serie - 1] = {
        kg: r.kg || '',
        reps: r.reps_reales || '',
        done: r.completada || false
      };
    });
    save();
  }).catch(function() {});
}

async function loadClienteData() {
  try {
    // ── 1. Perfil básico del usuario ────────────────────────────────────────
    const perfil = await api('GET', '/api/clientes/me/perfil');
    const nom = (perfil.nombre || '').split(' ')[0];
    const init = nom[0] || 'C';
    ST.u.nom = nom;
    ST.u.init = init.toUpperCase();
    ST.u.tipo = perfil.tipo === '1a1' ? 'uno' : 'programa';
    ST.u.dob = perfil.fecha_nacimiento ? perfil.fecha_nacimiento.split('T')[0] : '';
    ST.u.lesiones = perfil.lesiones || '';
    ST.u.altura = parseFloat(perfil.altura) || 175;
    ST.pesoInicial = parseFloat(perfil.peso_inicial) || 0;

    // ── 2. Todo el plan en UNA sola llamada ──────────────────────────────────
    const plan = await api('GET', '/api/entreno/mi-plan');

    // Semana y bloque
    ST.u.semana = plan.semana_actual || 1;
    ST.u.semTotal = plan.semanas_bloque || 13;
    ST.u.inicioBloque = plan.fecha_inicio ? plan.fecha_inicio.split('T')[0] : '';
    ST.u.diasEnt = plan.dias_entreno || 3;

    // Fase y objetivos
    ST.p.fase = plan.fase || 'deficit';
    ST.p.objSemKg = plan.obj_sem_kg != null ? plan.obj_sem_kg : null;
    ST.objPeso = plan.objetivo_kg ? parseFloat(plan.objetivo_kg) : 0;

    // Macros
    ST.p.macro = {
      kcal: plan.macros.kcal || 0,
      p: plan.macros.p || 0,
      c: plan.macros.c || 0,
      g: plan.macros.g || 0
    };
    ST.p.comidas = plan.comidas || 3;

    // Rutina
    ST.p.rutinaCod = plan.rutina_cod || '';
    ST.p.rutinaDias = plan.rutina_base || plan.rutina_dias || {};
    ST.p.rutinaSemanas = plan.rutina_semanas || {};
    // Build DIAS array from plan data
    buildDIAS(ST.u.semana || 1);

    // Pasos
    ST.u.pasosObj = plan.pasos_obj || 8000;

    // Menú personalizado — aplicar cantidades del plan al MENU global
    if (plan.alimentos && Object.keys(plan.alimentos).length > 0) {
      ST.p.planAlimentos = plan.alimentos;
      aplicarCantidadesPersonalizadas(plan.alimentos);
    }

    // Medidas y fotos S0 — cargar en revHistorial[0] para que aparezcan en Progreso y Revisión
    ST.medidasS0 = plan.medidas_s0 || {};
    const fotosS0 = plan.fotos_s0 || {};
    if (Object.keys(fotosS0).length > 0) {
      if (!ST.revHistorial) ST.revHistorial = {};
      if (!ST.revHistorial[0]) ST.revHistorial[0] = { fotos: {}, medidas: {} };
      // fotosS0 format from BD: { frente: url, perfil_d: url, perfil_i: url, espalda: url }
      // App expects: { rev_0: url, rev_1: url, rev_2: url, rev_3: url }
      const POSE_MAP = { frente: 0, perfil_d: 1, perfil_i: 2, espalda: 3 };
      Object.entries(fotosS0).forEach(function([pose, url]) {
        const idx = POSE_MAP[pose];
        if (idx !== undefined && url) ST.revHistorial[0].fotos['rev_' + idx] = url;
      });
      // Also load medidas S0
      if (Object.keys(ST.medidasS0).length > 0) {
        ST.revHistorial[0].medidas = ST.medidasS0;
      }
    }

    // ── 3. Pesos desde BD ────────────────────────────────────────────────────
    try {
      const pesos = await api('GET', '/api/entreno/pesos');
      ST.pesos = (pesos || []).map(p => ({ f: p.fecha ? p.fecha.split('T')[0] : p.f, v: parseFloat(p.peso || p.v) }));
    } catch(e) { ST.pesos = []; }

    // Cargar historial de entreno desde BD
    cargarHistorial();

    // ── 4. Menú semanal guardado ─────────────────────────────────────────────
    try {
      const menuBD = await api('GET', '/api/entreno/menu-semanal');
      if (menuBD && menuBD.menu_semanal) {
        Object.entries(menuBD.menu_semanal).forEach(([day, meals]) => {
          ST.menuGuardado[parseInt(day)] = meals;
        });
      }
    } catch(e) {}

    save();
    render();
  } catch(e) {
    console.error('loadClienteData error:', e);
    render();
  }
}


function showApp(){
  document.getElementById('lw').style.display='none';
  document.getElementById('app').classList.add('on');
  document.getElementById('avbtn').textContent=ST.u.init||'CL';
  const li=document.getElementById('loginLogoImg')||document.querySelector('.llo img');
  const tl=document.getElementById('topLogo');
  if(li&&tl)tl.src=li.src;
  S('inicio');
}

// Auto-login si hay token guardado
window.addEventListener('DOMContentLoaded',async()=>{
  // Si viene con ?tk= en URL (desde panel "Ver app") usarlo directamente
  const urlParams=new URLSearchParams(window.location.search);
  const tkParam=urlParams.get('tk');
  if(tkParam){
    _tk=tkParam;
    _isPreview=true;
    // NO guardarlo en localStorage — sesión temporal solo para esta pestaña
    try{
      await loadClienteData();
      ST.semVer=ST.u.semana||1;
      showApp();
      // Limpiar el token de la URL sin recargar
      if(window.history&&window.history.replaceState){
        window.history.replaceState({},'',window.location.pathname);
      }
      return;
    }catch(e){
      _tk=null;
    }
  }
  // Login normal con token guardado
  if(_tk){
    try{
      await loadClienteData();
      ST.semVer=ST.u.semana||1;
      showApp();
      return;
    }catch(e){
      _tk=null;
      localStorage.removeItem('ef_tk');
    }
  }
});

document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.getElementById('lw').style.display!=='none')doLogin();});

// ── TOAST & MODAL ──
function toast(msg,tipo){const el=document.getElementById('toast');el.textContent=msg;el.className='toast show'+(tipo?' '+tipo:'');setTimeout(()=>el.classList.remove('show'),2800);}
function openModal(t,c){document.getElementById('modalT').textContent=t;document.getElementById('modalC').innerHTML=c;document.getElementById('modalBg').classList.add('show');}
function closeModal(){document.getElementById('modalBg').classList.remove('show');}

// ── INICIO ──
function renderInicio(){
  const {semana:s,semTotal:st,tipo,inicioBloque}=ST.u;
  const s0Done=(ST.rev&&ST.rev.s0Done)||false;
  const s0Banner=(!s0Done&&s<=1)?'<div style="background:linear-gradient(135deg,#FF6B00,#E65A00);border-radius:12px;padding:13px 15px;color:#fff;margin-bottom:11px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="S(\'revision\')"><div style="font-size:26px">📸</div><div style="flex:1"><div style="font-weight:800;font-size:14px;margin-bottom:3px">Pendiente: fotos y medidas de S0</div><div style="font-size:12px;opacity:.85">Súbelas antes de empezar la semana 1. Son tu punto de partida para comparar tu progreso.</div></div><div style="font-size:18px;opacity:.7">→</div></div>':'';
  const revSems=tipo==='programa'?[4,8,12]:[3,7,11];
  const nextRev=revSems.find(rs=>rs>=s)||revSems[revSems.length-1];
  const semsLeft=nextRev-s;
  const adh=ST.adh;
  const adhPct=Math.round(adh*100);
  const adhCol=adh>=.8?'var(--vd)':adh>=.6?'var(--nr)':'var(--rj)';
  const todayDow=new Date().getDay();
  const diaIdx=[6,0,1,2,3,4,5][todayDow]||0;
  const diaHoy=DIAS[diaIdx];

  // Semanas bloque
  let semBloq='';
  for(let i=1;i<=st;i++){
    const isRev=revSems.includes(i);
    const cls=i<s?'sw-done':i===s?(isRev?'sw-rev':'sw-cur'):'sw-fut';
    semBloq+=`<div class="sw ${cls}" title="S${i}${isRev?' ✓ Rev':''}">${i}</div>`;
  }

  return`
<div class="banner ${semsLeft<=1?'nr':'az'}" onclick="S('revision')">
  <div style="font-size:10px;font-weight:700;opacity:.8;margin-bottom:3px">${semsLeft<=1?'⚠️ REVISIÓN URGENTE':'📅 PRÓXIMA REVISIÓN'}</div>
  <div style="font-size:19px;font-weight:800;margin-bottom:2px">Semana ${nextRev}${semsLeft===0?' · ¡Esta semana!':' · en '+semsLeft+' sem.'}</div>
  <div style="font-size:12px;opacity:.8">Semana ${s} de ${st} del bloque → Toca para revisar</div>
</div>

<div class="banner vd" onclick="S('entreno')" style="cursor:pointer">
  <div style="font-size:10px;font-weight:700;opacity:.8;margin-bottom:3px">HOY TOCA</div>
  <div style="font-size:17px;font-weight:800;margin-bottom:2px">${diaHoy.rest?'Día de descanso 😴':diaHoy.nom+' — '+diaHoy.tipo}</div>
  <div style="font-size:12px;opacity:.8">${diaHoy.rest?'Muévete, acumula pasos y cuida la nutrición':'Toca para ver los ejercicios →'}</div>
</div>

<div class="sgrid">
  <div class="stat"><div class="stat-v" style="color:var(--az)">S${s}</div><div class="stat-l">Semana bloque</div></div>
  <div class="stat"><div class="stat-v" style="color:var(--vd)">${adhPct}%</div><div class="stat-l">Adherencia</div></div>
  <div class="stat"><div class="stat-v" style="color:var(--nr)">${ST.racha}🔥</div><div class="stat-l">Racha días</div></div>
  <div class="stat"><div class="stat-v" style="color:var(--az2)">${ST.pesos.length?ST.pesos[ST.pesos.length-1].v:'—'}kg</div><div class="stat-l">Peso actual</div></div>
</div>

<div class="pasos-card">
  <div style="font-size:10px;font-weight:700;opacity:.75;text-transform:uppercase;margin-bottom:3px">🚶 Objetivo diario de pasos</div>
  <div class="pasos-n">${ST.pasos.obj.toLocaleString('es')}</div>
  <div class="pasos-bar"><div class="pasos-fill" style="width:100%"></div></div>
  <div style="font-size:11px;opacity:.85;margin-top:5px">Mantén este objetivo todos los días</div>
</div>

<div class="racha-card">
  <div style="font-size:36px">🔥</div>
  <div><div style="font-size:19px;font-weight:800">${ST.racha} días de racha</div><div style="font-size:12px;opacity:.8">¡No lo rompas!</div></div>
</div>

<div class="card">
  <div class="ch"><h2>📊 Adherencia semana pasada</h2><span class="badge ${adh>=.8?'bvd':'bnr'}">${adhPct}%</span></div>
  <div class="cb">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
      <div class="maci"><div class="macv" style="color:var(--az);font-size:17px">4/4</div><div class="macl">Entrenos</div></div>
      <div class="maci"><div class="macv" style="color:var(--vd);font-size:17px">6/7</div><div class="macl">Nutrición</div></div>
      <div class="maci"><div class="macv" style="color:var(--nr);font-size:17px">5/7</div><div class="macl">Pasos</div></div>
    </div>
    <div class="pb"><div class="pf" style="width:${adhPct}%;background:${adhCol}"></div></div>
  </div>
</div>

<div class="card">
  <div class="ch"><h2>📅 Progreso del bloque</h2><span class="badge baz">S${s}/${st}</span></div>
  <div class="cb">
    <div style="font-size:12px;color:var(--t3);margin-bottom:6px">🟢 Completada · 🟠 Actual · 🔵 Revisión · ⬜ Pendiente</div>
    <div class="semp">${semBloq}</div>
    <div style="font-size:12px;color:var(--t3);margin-top:6px">${Math.round(s/st*100)}% del bloque completado</div>
  </div>
</div>

${renderCI()}`;
}

// ── CHECK-IN ──
function ciToggle(){
  ST.ci.open=!ST.ci.open;save();
  var card=document.querySelector('[data-ci-card]');
  if(!card){var ct=document.getElementById('ct');if(ct){var sp=ct.scrollTop;ct.innerHTML=renderInicio();ct.scrollTop=sp;}return;}
  var body=card.querySelector('[data-ci-body]');
  var arr=card.querySelector('[data-ci-arr]');
  if(body)body.style.display=ST.ci.open?'block':'none';
  if(arr)arr.textContent=ST.ci.open?'▲':'▼';
}
function renderCI(){
  var ci=ST.ci;var tipo=ST.u.tipo;
  var dp=DIAS.filter(function(d){return!d.rest;}).length||4;
  var adh=calcAdh();
  if(ci.done){
    return '<div class="card" style="margin-bottom:10px"><div class="ch" onclick="ST.ci.open=!ST.ci.open;render()" style="cursor:pointer">'
      +'<h2>Check-in enviado</h2>'
      +'<div style="display:flex;align-items:center;gap:8px">'
        +'<span style="font-size:16px;font-weight:900;color:'+(adh>=80?'var(--vd)':adh>=50?'var(--nr)':'var(--rj)')+'">'+adh+'%</span>'
        +'<span style="color:var(--t3)">'+(ci.open?'▲':'▼')+'</span>'
      +'</div></div>'
      +(ci.open?'<div class="cb"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">'
        +'<div style="text-align:center;background:var(--bg);border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:800;color:var(--az)">'+(ci.diasEnt||0)+'/'+dp+'</div><div style="font-size:9px;color:var(--t3)">Entrenos</div></div>'
        +'<div style="text-align:center;background:var(--bg);border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:800;color:var(--az)">'+(ci.diasNut||0)+'/7</div><div style="font-size:9px;color:var(--t3)">Nutricion</div></div>'
        +'<div style="text-align:center;background:var(--bg);border-radius:8px;padding:10px"><div style="font-size:20px;font-weight:800;color:var(--az)">'+(ci.diasPasos||0)+'/7</div><div style="font-size:9px;color:var(--t3)">Pasos</div></div>'
      +'</div><button class="btn bo" style="width:100%" onclick="ST.ci.done=false;ST.ci.open=true;save();render()">Editar respuestas</button></div>':'')
    +'</div>';
  }
  function mkDots(key,val,mx){
    var s='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">';
    for(var i=1;i<=mx;i++){
      s+='<button type="button" data-k="'+key+'" data-v="'+i+'" data-m="'+mx+'" onclick="ciDot(this)" '
        +'style="width:32px;height:32px;border-radius:50%;border:2.5px solid var(--az);cursor:pointer;background:'+(i<=(val||0)?'var(--az)':'transparent')+'"></button>';
    }
    return s+'</div>';
  }
  var h='<div class="card" style="margin-bottom:10px">'
    +'<div class="ch" onclick="ST.ci.open=!ST.ci.open;render()" style="cursor:pointer">'
      +'<h2>Check-in semanal</h2><span style="color:var(--t3)">'+(ci.open?'▲':'▼')+'</span>'
    +'</div>';
  if(!ci.open)return h+'</div>';
  h+='<div class="cb">';
  if(tipo==='uno'){
    h+='<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:600;margin-bottom:6px">Como fue la semana anterior?</div>'
      +'<textarea oninput="ST.ci.como=this.value;save()" style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:10px;font-family:inherit;font-size:13px;resize:none;min-height:65px;box-sizing:border-box;outline:none">'+(ci.como||'')+'</textarea></div>';
  }
  h+='<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<span style="font-size:12px;font-weight:600">Dias entrenamiento</span>'
      +'<span id="ci-ent-n" style="font-weight:800;color:var(--az)">'+(ci.diasEnt||0)+'/'+dp+'</span></div>'
    +mkDots('diasEnt',ci.diasEnt||0,dp)+'</div>';
  h+='<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<span style="font-size:12px;font-weight:600">Dias plan nutricional</span>'
      +'<span id="ci-nut-n" style="font-weight:800;color:var(--az)">'+(ci.diasNut||0)+'/7</span></div>'
    +mkDots('diasNut',ci.diasNut||0,7)+'</div>';
  h+='<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<span style="font-size:12px;font-weight:600">Dias pasos</span>'
      +'<span id="ci-pas-n" style="font-weight:800;color:var(--az)">'+(ci.diasPasos||0)+'/7</span></div>'
    +mkDots('diasPasos',ci.diasPasos||0,7)+'</div>';
  if(tipo==='uno'){
    h+='<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">De que te enorgulleces esta semana</div>'
      +'<textarea oninput="ST.ci.orgullo=this.value;save()" style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:10px;font-family:inherit;font-size:13px;resize:none;min-height:55px;box-sizing:border-box;outline:none">'+(ci.orgullo||'')+'</textarea></div>'
    +'<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">Compromiso esta semana</div>'
      +'<textarea oninput="ST.ci.compromiso=this.value;save()" style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:10px;font-family:inherit;font-size:13px;resize:none;min-height:55px;box-sizing:border-box;outline:none">'+(ci.compromiso||'')+'</textarea></div>'
    +'<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">Sensaciones generales</div>'
      +'<textarea oninput="ST.ci.sensaciones=this.value;save()" style="width:100%;border:1.5px solid var(--bor);border-radius:8px;padding:10px;font-family:inherit;font-size:13px;resize:none;min-height:55px;box-sizing:border-box;outline:none">'+(ci.sensaciones||'')+'</textarea></div>';
  }
  h+='<div style="background:var(--az3);border-radius:8px;padding:10px;text-align:center;margin-bottom:12px">'
    +'<div style="font-size:10px;color:var(--t3)">Adherencia estimada</div>'
    +'<div style="font-size:28px;font-weight:900;color:var(--az)" id="ci-adh">'+adh+'%</div>'
  +'</div>'
  +'<button class="btn bp" style="width:100%;padding:14px;font-size:15px" onclick="enviarCI()">Enviar</button>'
  +'</div></div>';
  return h;
}
function ciDot(btn){
  var key=btn.dataset.k,val=parseInt(btn.dataset.v),mx=parseInt(btn.dataset.m);
  ST.ci[key]=val;save();
  btn.parentNode.querySelectorAll('button').forEach(function(b){
    b.style.background=parseInt(b.dataset.v)<=val?'var(--az)':'transparent';
  });
  var ids={diasEnt:'ci-ent-n',diasNut:'ci-nut-n',diasPasos:'ci-pas-n'};
  var el=document.getElementById(ids[key]);if(el)el.textContent=val+'/'+mx;
  var ae=document.getElementById('ci-adh');if(ae)ae.textContent=calcAdh()+'%';
}
function calcAdh(){
  var ci=ST.ci,dp=DIAS.filter(function(d){return!d.rest;}).length||4;
  return Math.round(Math.min(1,(ci.diasEnt||0)/dp)*40+Math.min(1,(ci.diasNut||0)/7)*40+Math.min(1,(ci.diasPasos||0)/7)*20);
}


function enviarCI(){
  ST.ci.adh=calcAdh();ST.ci.done=true;ST.ci.open=false;save();
  var _c=document.querySelector('[data-ci-card]');
  if(_c){var _t=document.createElement('div');_t.innerHTML=renderCI();_c.replaceWith(_t.firstChild);}
  else{var _ct=document.getElementById('ct');if(_ct){var _sp=_ct.scrollTop;_ct.innerHTML=renderInicio();_ct.scrollTop=_sp;}}
  toast('Check-in enviado ✓ — '+ST.ci.adh+'%','vd');
  if(_tk){api('POST','/api/entreno/checkin',{semana_inicio:ST.u.inicioBloque||new Date().toISOString().split('T')[0],dias_entreno_real:ST.ci.diasEnt||0,dias_nutricion:ST.ci.diasNut||0,dias_pasos:ST.ci.diasPasos||0,orgullos:ST.ci.orgullo||'',compromisos:ST.ci.compromiso||'',sensaciones:ST.ci.sensaciones||'',como_semana:ST.ci.como||'',adherencia:ST.ci.adh||0}).catch(function(e){console.warn('[CI]',e);});}
}


function doLogout(){
  _tk=null;
  localStorage.removeItem('ef_tk');
  localStorage.removeItem('ef8');
  location.reload();
}

// ── Generar equivalencias del plan del entrenador ───────────────────────────
// El entrenador define UN alimento base por categoría/comida con una cantidad.
// La app calcula los macros de ese alimento base y genera equivalencias
// de todos los alimentos de esa categoría con la misma carga de macros.

function calcularEquivalencias(planAlimentos) {
  // planAlimentos: { desayuno: [{nom, cat, cantidad, p100, c100, g100, k100, u}...], ... }
  // Retorna MENU con cantidades ajustadas por equivalencia
  var resultado = {};

  // Map cat codes to MENU category keys
  var CAT_MAP = {
    'prot': 'proteinas_magras',
    'prot_g': 'proteinas_grasas',
    'hidrat': 'hidratos',
    'fat': 'grasas',
    'verd': 'verduras',
    'fruta': 'frutas',
    'grasas_superavit': 'grasas_superavit'
  };

  // Meal key mapping (plan uses flat keys, MENU uses same)
  var MEAL_KEYS = ['desayuno','comida','cena','snack'];

  MEAL_KEYS.forEach(function(meal) {
    var planItems = planAlimentos[meal];
    if (!planItems || !MENU[meal]) return;

    resultado[meal] = { nom: MENU[meal].nom };

    // Group plan items by category
    var planByCat = {};
    planItems.forEach(function(item) {
      if (!planByCat[item.cat]) planByCat[item.cat] = item;
    });

    // For each category in MENU, calculate equivalences
    Object.keys(MENU[meal]).forEach(function(menuCat) {
      if (menuCat === 'nom') return;
      var menuItems = MENU[meal][menuCat];
      if (!Array.isArray(menuItems)) return;

      // Find the plan item for this category
      // cat code in plan vs MENU key
      var planItem = null;
      Object.keys(CAT_MAP).forEach(function(catCode) {
        if (CAT_MAP[catCode] === menuCat && planByCat[catCode]) {
          planItem = planByCat[catCode];
        }
      });

      if (!planItem) {
        // No base item from trainer — use MENU defaults
        resultado[meal][menuCat] = menuItems;
        return;
      }

      // Calculate target macros from the trainer's base item
      var baseCant = planItem.cantidad || 100;
      var baseP100 = planItem.p100 || 0;
      var baseC100 = planItem.c100 || 0;
      var baseG100 = planItem.g100 || 0;

      // Target macros = (base_cantidad / 100) * per100g_value
      var targetP = (baseCant / 100) * baseP100;
      var targetC = (baseCant / 100) * baseC100;
      var targetG = (baseCant / 100) * baseG100;

      // Determine which macro to use for equivalence
      // prot -> use protein, hidrat -> use carbs, fat/grasas -> use fat
      var useMacro = 'p';
      var targetMacro = targetP;
      if (menuCat === 'hidratos') { useMacro = 'c'; targetMacro = targetC; }
      else if (menuCat === 'grasas' || menuCat === 'grasas_superavit') { useMacro = 'g'; targetMacro = targetG; }
      else if (menuCat === 'verduras' || menuCat === 'frutas') {
        // Use kcal for verduras/frutas
        resultado[meal][menuCat] = menuItems;
        return;
      }

      if (!targetMacro || targetMacro === 0) {
        resultado[meal][menuCat] = menuItems;
        return;
      }

      // Calculate equivalent quantity for each MENU item
      resultado[meal][menuCat] = menuItems.map(function(mi) {
        var per100 = useMacro === 'p' ? (mi.p||0) : useMacro === 'c' ? (mi.c||0) : (mi.g||0);
        // per100 is already the value FOR the base quantity (not per 100g)
        // Need to get per-100g value
        var miCant = mi.cantidad || 100;
        var per100g = miCant > 0 ? (per100 / miCant) * 100 : 0;

        if (!per100g || per100g === 0) return mi;

        var newCant = Math.max(5, Math.round((targetMacro / per100g) * 100 / 5) * 5);
        var factor = newCant / miCant;

        return {
          nom: mi.nom,
          cantidad: newCant,
          u: mi.u,
          p: Math.round(mi.p * factor * 10) / 10,
          c: Math.round(mi.c * factor * 10) / 10,
          g: Math.round(mi.g * factor * 10) / 10,
          kcal: Math.round(mi.kcal * factor)
        };
      });
    });
  });

  return resultado;
}

function aplicarCantidadesPersonalizadas(planAlimentos) {
  if (!planAlimentos || !Object.keys(planAlimentos).length) return;
  var equivalencias = calcularEquivalencias(planAlimentos);
  // Apply to MENU
  Object.keys(equivalencias).forEach(function(meal) {
    if (!MENU[meal]) return;
    Object.keys(equivalencias[meal]).forEach(function(cat) {
      if (cat === 'nom') return;
      MENU[meal][cat] = equivalencias[meal][cat];
    });
  });
  ST.menuPersonalizado = true;
}


