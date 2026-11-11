import { Prayer, PrayerCategory } from '../models/prayer.models';

export const PRAYER_CATEGORIES: PrayerCategory[] = [
  { id: 'rosary', title: 'Rosario', icon: 'flower-outline', order: 10 },
  { id: 'morning', title: 'Mañana', icon: 'sunny-outline', order: 20 },
  { id: 'night', title: 'Noche', icon: 'moon-outline', order: 30 },
  { id: 'protection', title: 'Protección', icon: 'shield-outline', order: 40 },
  { id: 'virgin', title: 'Virgen María', icon: 'heart-outline', order: 50 },
  { id: 'saints', title: 'Santos', icon: 'sparkles-outline', order: 60 },
  { id: 'before_meal', title: 'Antes de comer', icon: 'restaurant-outline', order: 70 },
  { id: 'after_communion', title: 'Después de comulgar', icon: 'wine-outline', order: 80 },
  { id: 'contrition', title: 'Contrición', icon: 'water-outline', order: 90 },
  { id: 'holy_spirit', title: 'Espíritu Santo', icon: 'flame-outline', order: 100 },
  { id: 'thanks', title: 'Acción de gracias', icon: 'thumbs-up-outline', order: 110 },
];

export const PRAYERS: Prayer[] = [
  // ROSARIO (básicos)
  {
    id: 'sign-of-the-cross',
    title: 'Señal de la Cruz',
    categoryId: 'rosary',
    short: 'En el nombre del Padre…',
    body:
`Por la señal de la Santa Cruz,
de nuestros enemigos
líbranos, Señor, Dios nuestro.

En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.`,
    tags: ['inicio', 'básica'],
    source: 'Tradicional',
  },
  {
    id: 'creed-apostles',
    title: 'Credo de los Apóstoles',
    categoryId: 'rosary',
    short: 'Creo en Dios, Padre todopoderoso…',
    body:
`Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra.
Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo; nació de Santa María Virgen; padeció bajo el poder de Poncio Pilato; fue crucificado, muerto y sepultado; descendió a los infiernos; al tercer día resucitó de entre los muertos; subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso; desde allí ha de venir a juzgar a vivos y muertos.
Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.`,
    tags: ['rosario', 'credo'],
    source: 'Tradicional',
  },
  {
    id: 'our-father',
    title: 'Padre Nuestro',
    categoryId: 'rosary',
    short: 'Padre nuestro, que estás en el cielo…',
    body:
`Padre nuestro, que estás en el cielo,
santificado sea tu Nombre;
venga a nosotros tu reino;
hágase tu voluntad en la tierra como en el cielo.
Danos hoy nuestro pan de cada día;
perdona nuestras ofensas,
como también nosotros perdonamos a los que nos ofenden;
no nos dejes caer en la tentación,
y líbranos del mal. Amén.`,
    tags: ['básica', 'rosario'],
    source: 'Liturgia',
  },
  {
    id: 'hail-mary',
    title: 'Avemaría',
    categoryId: 'rosary',
    short: 'Dios te salve, María…',
    body:
`Dios te salve, María,
llena eres de gracia,
el Señor es contigo;
bendita tú eres entre todas las mujeres,
y bendito es el fruto de tu vientre, Jesús.

Santa María, Madre de Dios,
ruega por nosotros, pecadores,
ahora y en la hora de nuestra muerte. Amén.`,
    tags: ['básica', 'rosario'],
    source: 'Tradicional',
  },
  {
    id: 'glory-be',
    title: 'Gloria',
    categoryId: 'rosary',
    short: 'Gloria al Padre, y al Hijo…',
    body:
`Gloria al Padre, y al Hijo, y al Espíritu Santo.
Como era en el principio, ahora y siempre,
por los siglos de los siglos. Amén.`,
    tags: ['básica', 'rosario'],
    source: 'Tradicional',
  },
  {
    id: 'fatima-prayer',
    title: 'Oración de Fátima',
    categoryId: 'rosary',
    short: 'Oh Jesús mío, perdona nuestros pecados…',
    body:
`Oh Jesús mío, perdona nuestros pecados,
líbranos del fuego del infierno,
lleva al cielo a todas las almas,
especialmente a las más necesitadas de tu misericordia. Amén.`,
    tags: ['rosario', 'fátima'],
    source: 'Tradicional',
  },
  {
    id: 'hail-holy-queen',
    title: 'Salve',
    categoryId: 'rosary',
    short: 'Dios te salve, Reina y Madre…',
    body:
`Dios te salve, Reina y Madre de misericordia,
vida, dulzura y esperanza nuestra; Dios te salve.
A ti llamamos los desterrados hijos de Eva;
a ti suspiramos gimiendo y llorando en este valle de lágrimas.
Ea, pues, Señora, abogada nuestra,
vuelve a nosotros esos tus ojos misericordiosos;
y después de este destierro, muéstranos a Jesús,
fruto bendito de tu vientre.
¡Oh clemente, oh piadosa, oh dulce Virgen María!

Ruega por nosotros, Santa Madre de Dios,
para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.`,
    tags: ['rosario', 'maría'],
    source: 'Tradicional',
  },

  // MAÑANA
  {
    id: 'morning-offering',
    title: 'Ofrecimiento de Obras (Mañana)',
    categoryId: 'morning',
    short: 'Te ofrezco, Señor, mi jornada…',
    body:
`Señor Dios, al comenzar este día
te ofrezco mis pensamientos, palabras, obras y alegrías,
también mis dificultades y sufrimientos.

Concédeme vivirlo en tu presencia,
con un corazón limpio y generoso,
y haz que todo sea para tu gloria
y el bien de los demás. Amén.`,
    tags: ['mañana', 'ofrenda'],
    source: 'Tradicional',
  },

  // NOCHE
  {
    id: 'night-prayer-simple',
    title: 'Oración de la Noche',
    categoryId: 'night',
    short: 'Gracias, Señor, por este día…',
    body:
`Gracias, Señor, por este día que termina.
Perdona mis faltas y omisiones,
y danos tu paz.

Cuida de mi familia y de quienes amo;
protege a los que sufren;
y concédeme descansar en tu amor.

En tus manos encomiendo mi espíritu. Amén.`,
    tags: ['noche', 'paz'],
    source: 'Tradicional',
  },

  // PROTECCIÓN
  {
    id: 'guardian-angel',
    title: 'Ángel de la Guarda',
    categoryId: 'protection',
    short: 'Ángel de la guarda, dulce compañía…',
    body:
`Ángel de la guarda, dulce compañía,
no me desampares ni de noche ni de día;
no me dejes solo, que me perdería.

Hasta que me pongas en paz y alegría
con todos los santos, Jesús, José y María. Amén.`,
    tags: ['protección', 'niños'],
    source: 'Tradicional',
  },

  // CONTRICIÓN
  {
    id: 'act-of-contrition',
    title: 'Acto de Contrición',
    categoryId: 'contrition',
    short: 'Señor mío Jesucristo…',
    body:
`Señor mío Jesucristo, Dios y Hombre verdadero,
Creador, Padre y Redentor mío:
por ser Tú quien eres, bondad infinita,
y porque te amo sobre todas las cosas,
me pesa de todo corazón haberte ofendido.

Propongo firmemente, con tu gracia,
enmendarme y evitar las ocasiones de pecado,
confesarme y cumplir la penitencia.

Amén.`,
    tags: ['confesión', 'perdón'],
    source: 'Tradicional',
  },

  // ESPÍRITU SANTO
  {
    id: 'come-holy-spirit',
    title: 'Ven, Espíritu Santo',
    categoryId: 'holy_spirit',
    short: 'Ven, Espíritu Santo, llena los corazones…',
    body:
`Ven, Espíritu Santo,
llena los corazones de tus fieles
y enciende en ellos el fuego de tu amor.

Envía tu Espíritu y todo será creado,
y renovarás la faz de la tierra.

Oh Dios, que instruiste los corazones de tus fieles
con la luz del Espíritu Santo,
concédenos gustar de lo recto según el mismo Espíritu
y gozar siempre de sus consuelos.

Por Jesucristo nuestro Señor. Amén.`,
    tags: ['luz', 'discernimiento'],
    source: 'Liturgia',
  },

  // ANTES DE COMER
  {
    id: 'before-meal',
    title: 'Bendición de la Mesa',
    categoryId: 'before_meal',
    short: 'Bendícenos, Señor…',
    body:
`Bendícenos, Señor, y bendice estos alimentos
que vamos a recibir de tu generosidad.
Por Jesucristo nuestro Señor. Amén.`,
    tags: ['mesa'],
    source: 'Tradicional',
  },

  // DESPUÉS DE COMULGAR (breve)
  {
    id: 'after-communion-thanks',
    title: 'Después de Comulgar (Acción de gracias)',
    categoryId: 'after_communion',
    short: 'Señor Jesús, gracias por venir a mí…',
    body:
`Señor Jesús, gracias por venir a mí.
Quédate conmigo y transforma mi corazón.

Que mi vida sea reflejo de tu amor,
y que nunca me aparte de Ti. Amén.`,
    tags: ['eucaristía'],
    source: 'Tradicional',
  },

  // VIRGEN
  {
    id: 'memorare',
    title: 'Acordaos (Memorare)',
    categoryId: 'virgin',
    short: 'Acordaos, oh piadosísima Virgen María…',
    body:
`Acordaos, oh piadosísima Virgen María,
que jamás se ha oído decir
que ninguno de los que han acudido a vuestra protección,
implorado vuestra asistencia
y reclamado vuestro socorro
haya sido abandonado.

Animado con esta confianza, a vos también acudo,
oh Madre, Virgen de las vírgenes;
y, aunque gimiendo bajo el peso de mis pecados,
me atrevo a comparecer ante vos.

No desechéis mis súplicas,
oh Madre de Dios,
antes bien escuchadlas y acogedlas benignamente. Amén.`,
    tags: ['maría', 'confianza'],
    source: 'Tradicional',
  },

  // SANTOS
  {
    id: 'st-michael',
    title: 'San Miguel Arcángel',
    categoryId: 'saints',
    short: 'Defiéndenos en la batalla…',
    body:
`San Miguel Arcángel, defiéndenos en la batalla;
sé nuestro amparo contra la perversidad y asechanzas del demonio.

Reprímale Dios, pedimos suplicantes,
y tú, Príncipe de la milicia celestial,
arroja al infierno con el divino poder
a Satanás y a los otros espíritus malignos
que andan dispersos por el mundo
para la perdición de las almas. Amén.`,
    tags: ['protección', 'combate espiritual'],
    source: 'Tradicional',
  },

  // GRACIAS
  {
    id: 'thanks-short',
    title: 'Acción de Gracias (Breve)',
    categoryId: 'thanks',
    short: 'Gracias, Señor, por tus dones…',
    body:
`Gracias, Señor, por tus dones
y por tu presencia en mi vida.

Enséñame a reconocer tu amor
en lo pequeño y en lo grande,
y a vivir con un corazón agradecido. Amén.`,
    tags: ['gratitud'],
    source: 'Tradicional',
  },
];