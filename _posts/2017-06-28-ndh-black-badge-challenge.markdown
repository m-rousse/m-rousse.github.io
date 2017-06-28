---
layout: post
title:  "Write-up (à chaud) du challenge badge de la Nuit du Hack"
date:   2017-06-28 21:27:37 +0200
categories: challenge
excerpt: Write-up du Black Badge Challenge de la Nuit du Hack 2017.
---

Cette année, nous [Amré, Jean, Mathieu, Thibault] nous sommes rendus à la Nuit du Hack, et avons tenté le challenge "Black Badge". Ce challenge permet de gagner un badge collector qui offre à son possesseur une entrée gratuite ad vitam æternam. Intrigués, notre équipe spontanément formée s'est lancée à l'aventure. Ce court write-up a pour vocation d'expliquer comment on a procédé pour accéder au Saint Graal (et aussi d'évoquer les différentes difficultés qu'on a rencontré).

<!---excerpt-break-->

# TLDR;

0. Pour les 15 ans de la NDH, @virtualabs, @marcolanie et @f4grx ont réalisé un badge collector et un challenge permettant de gagner le Black Badge. Le badge est un clone du CrazyPA et communique sur du 2.4GHz GFSK (comme un bon nombre de claviers/souris sans fils)
1. On a extrait une adresse codée en binaire dans la sérigraphie en haut du badge
2. Cette adresse nous a mené à un fichier polyglotte comprenant une carte des locaux de la NdH avec des énigmes
3. Des indices étaient disposés sur la carte : un lien bit.ly, une vidéo youtube, un lieu où sniffer un clavier microsoft et une phrase nous indiquant de chercher du BLE proche de Virtualabs
4. Le sniffing du traffic le long de la salle Staff nous a donné un lien bit.ly vers une photo de l'emplacement d'un Nano cache
5. Le nano cache contient un QR Code
6. Le QR Code contient un lien vers le firmware du périphérique BLE que porte Virtualabs
7. On reverse le firmware (en s'aidant du code de OpenLys, similaire à celui du badge, et des informations du SDK du constructeur de la puce programmée)
8. On trouve des indices sur le flag et un SHA256. On guess à partir de "S.A.5.f.W" -> "SHA256fTW", le périphérique nous renvoie "/HwR3ver5eR0xX0r"
9. L'URL reconstruite mène à une page sur le site de Virtualabs, avec dans le code source le saint Graal : "I am The Plague"
10. Challenge p0wned !

# Étape un : point de départ, le badge

Voici une [photo du badge de la nuit du hack](https://twitter.com/virtualabs/status/878557361480376320). Celui-ci pouvait être acheté sur le shop en ligne, et devait être retiré sur place.

Côté hardware, il s'agissait d'un clone du [Crazyradio PA](https://www.bitcraze.io/crazyradio-pa/) : une carte axée autour d'une puce Nordic Semiconductor nRF24LU1+. Ça nous a mis la puce à l'oreille (désolé...) que quelque chose allait se passer sur les bandes 2.4Ghz à un moment ou à un autre, mais quoi ? De l'appairage entre badges pour obtenir un flag ?

Nous avons pris beaucoup de temps à trouver le premier élément de réponse du challenge. Nous savions que la réponse se trouvait dans les traits et points sérigraphiés en haut du badge, mais nous n'avons pas trouvé instinctivement comment extraire la moindre information : nous avons tenté le codage morse, code barre, d'échanger la position des lignes de barres, etc.

Pendant ce temps, nous expérimentions avec [nrf-research-firmware](https://github.com/BastilleResearch/nrf-research-firmware), le firmware flashé sur les badges, en essayant d'attraper quelques paquets potentiellement intéressants, mais sans succès. Nous sommes même allés jusqu'à essayer de scanner près de Virtualabs pendant sa keynote. Il est intéressant de noter que ce firmware peut être aussi flashé sur les "Nano receiver" Logitech, dongle réceptrice pour les claviers et souris sans-fil de la même marque.

Finalement, on a trouvé qu'il s'agissait d'une chaîne ASCII avec avec quelques bits manquant (des 0 en début et fin de lignes). Les points noirs représentent les 1 et les blancs les 0, en se basant sur l'image postée par [@virtualabs](https://twitter.com/virtualabs), on peut la quadriller pour lire plus facilement le message :

{% lightbox ndhXVbbc-step1.png %}

On lit alors :

```
1110110 01101001 011100 1110100 01110101 01100001
1101100 01100001 011000 1110011 00101110 01100110
1110010 00101111                 1101110 01100100
1101000                                   1111000
1110110
```

Soit en hexa : `7669727475616C6162732E66722F6E64687876`, qui correspond à `virtualabs.fr/ndhxv` en ascii !

# Étape deux : une image coriace

Au rendu de la page web évoquée ci-dessus dans un navigateur, on aperçoit furtivement le texte `PNG`. Ni une, ni deux, on va chercher le code source de la page qui n'est autre qu'un PNG avec un peu de HTML (fichier polyglote, un [épisode de NoLimitSecu](https://www.nolimitsecu.fr/ange-albertini-funky-file-formats/) y est consacré) pour rendre le navigateur content et qu'il n'affiche pas l'image cachée.

On décide de garder uniquement la partie PNG de l'hybride mais on se heurte à un soucis : l'image PNG est corrompue. On constate (à l'aide des [super fiches de synthèse de Ange Albertini](https://github.com/corkami/pics/blob/master/binary/PNG.png)) que certains retours à la ligne `\r\n` sont transformés en `\n`. On a essayé beaucoup de techniques (ça mériterait à la limite un article à part entière), en particulier [PNG uncorrupt](http://toh.necst.it/plaidctf2015/forensics/PNG_Uncorrupt/) et [ça](http://blog.knapsy.com/blog/2014/11/17/png-from-hell-ruxcon-ctf-challenge/) utilisés lors d'autres CTF, mais malheureusement sans succès.

On décide alors d'appeler Virtualabs au secours : effectivement, ce "challenge" n'était pas volontaire et était lié à une erreur de transfert du fichier HTML/PNG (qui a été transféré en mode texte au lieu du mode binaire). Une fois le bug corrigé, plus de problème pour ouvrir l'image.

L'image contient une carte du lieu de l'évènement avec en dessous une phrase inintelligible `Qhhe spedar, whyn iyxlgrvgk sbz lahytb urdy @ilygxhydif`. À première vue, on remarque que le `@ilygxhygif` ressemble farouchement à un nom de compte twitter, on suppose qu'il s'agit de `@virtualabs`. Après avoir rapidement tenté d'utiliser le chiffre de César, nous avons essayé le chiffre de Vigenère, avec pour clé `NDH` ([ce décodeur](http://www.dcode.fr/chiffre-vigenere) nous aura été bien utile). Le message suivant nous apparaît alors : `Dear pirate, talk bluetooth low energy near @virtualabs`.

On a été naïvement parler de Bluetooth Low Energy à Virtu sans grand espoir, mais sur un malentendu, ç'aurait put être intéressant ! Évidemment, ce n'était pas ce que l'indice voulait nous faire comprendre.
Alors, armé de notre téléphone portable et de l'application *nRF Connect* fraîchement installée, on est reparti à la chasse au Virtu. Après quelques minutes à errer, on aperçoit notre cible et immédiatement notre téléphone aperçoit sa victime : un périphérique Bluetooth Low Energy nommé `WantBlackBadge?`. C'est à ce moment qu'on se rendit compte que ce challenge commençait (inconsciemment) à s'apparenter à du stalking, tantôt en attendant Virtualabs à la sortie des toilettes pour accrocher son badge, tantôt en campant près de la salle du staff de la NdH.

Nous avons trouvé notre prochaine cible, mais n'avons aucune idée de technique pour l'aborder. On retourne alors à la carte pour essayer de déchiffrer les autres indices.
Les logos nous parlent pas mal :
- Un logo Windows avec la mention "DC-Admin"
- Le logo de MouseJack avec des ondes en direction du logo Windows
- Un logo de blowfish qui ne nous évoque rien

Après un long moment de recherches , on découvre que le Fugu est le logo de Bit.ly (https://bitly.com/pages/about) en déguisement de pirate. Ce qui nous invite à visiter l'URL https://bit.ly/2sLOIFU, qui nous redirige vers l'image d'un [Nano Cache](https://www.101geo.com.au/collections/containers/products/nano-cache-container-silver) : une fiche produit nous indique que cette petite boite métallique aimantée est grande de 1 cm par 2 cm. On s'est alors lancé dans une chasse au Nano Cache dans la zone représentée sur la carte. Décidés à tout tenter : nous avons tout passé au peigne fin : sous les poubelles, dans les pots de fleurs (avec des regards en travers de la sécurité perplexe de nos actions), derrière les moniteurs. Au bout d'une heure et demie de recherches vaines, on décide de passer à autre chose. Cela dit cette recherche nous aura permis de retrouver une pièce métallique appartenant à une machine mécanique exposée dans le hall, donc on ne considérera pas cela comme du temps perdu :)

Le dernier élément de la carte nous échappant était ce texte `kSuq3Ry9PLQ`. Après l'expérience avec Chauncey (le logo de Bit.ly), on a cherché de quel service cette chaîne de caractères pourrait être un identifiant. Notre premier essai sera le bon : YouTube. Il s'agit d'une [conférence de la DefCon 24 présentée par LosT](https://youtube.com/watch?v=kSuq3Ry9PLQ) que nous avons regardé en diagonale en prenant l'air dehors accompagnée d'un McDo de rigueur. Mis à part la description, elle ne nous a pas grandement inspiré (sauf à écrire ce write-up, c.f. le Q&A de ladite vidéo).

Virtualabs insistant sur l'importance du logo Windows, nous avons pensé que cela sous-entendait qu'il fallait écouter avec Mousejack les trames émises par un clavier Microsoft. Équipés de nos ordinateurs et badges, on a élu domicile dans le couloir entre la grande salle et le hall et lancé les outils développés par Bastille Research. Après un petit temps à scanner les canaux, collés au mur (histoire de s'affranchir d'un maximum de perturbations générées par tous les autres périphériques exploitant à font le 2.4GHz) à la recherche d'un signe, d'un message (#Calogero), Virtu nous a donné un coup de pouce en nous indiquant le canal à écouter : le 80. Ainsi informé, on a identifié rapidement le périphérique cible, un clavier doté de l'adresse 4E:44:48:58:56 (qui, en ASCII est "NDHXV"). On lance alors l'outil de sniffing et récupère un grand nombre de paquets. Les trames ressemblent à :

```
[2017-06-25 01:02:56.561]  80  16  4E:44:48:58:56  0A:78:06:01:BE:5E:0B:58:56:2F:44:48:58:56:4E:0C
[2017-06-25 01:02:56.567]  80  16  4E:44:48:58:56  0A:78:06:01:BF:5E:0B:58:56:4E:44:48:58:56:4E:6C
```

Soit : `[date] canal longueur_payload adresse payload`

Une lecture préalable du [whitepaper](https://github.com/BastilleResearch/mousejack/blob/master/doc/pdf/DEFCON-24-Marc-Newlin-MouseJack-Injecting-Keystrokes-Into-Wireless-Mice.whitepaper.pdf).publié par Bastille lors de la Defcon 24, de l'[article de Travis Goodspeed](http://travisgoodspeed.blogspot.fr/2011/02/promiscuity-is-nrf24l01s-duty.html) et [du code du projet KeySweeper de Samy Kamkar](http://samy.pl/keysweeper/) nous permet d'avoir une petite idée du format des trames et du chiffrement utilisé.
Les claviers sans-fils transmettent à l'hôte les touches pressées via les spécifications USB-HID. Ainsi, lorsque l'on frappe la touche 'a' de son clavier, le clavier transmet un message `keydown` avec l'identifiant de la touche, puis un message `keyup` avec pour identifiant de touche `0x00`. De ce fait, on observe deux paquets par appui/relâchement de touche.
Entre les différentes trames, seuls 3 octets changent, le 5° octet du paquet ressemble à un compteur (très souvent des nombres consécutifs), et le dernier octet lui serait un checksum de la trame.
Le 9° octet change souvent et serait donc la touche pressée.
Le chiffrement est réalisé en xorant le paquet avec un secret partagé, négocié lors de l'appairage du clavier avec la dongle réceptrice. Ceci signifie que l'octet correspondant à l'identifiant de la touche pressée sera toujours xoré avec le même octet.
Pour identifier la clé, il suffit d'identifier les paquets correspondant à `keyup`. Lors de la capture, nous avons eu un très grand nombre de paquets avec `0x4E` pour identifiant de touche. On suppose que ce sont les paquets `keyup` et ainsi l'octet utilisé pour le xor serait `0x4E`.
On a alors écrit un [petit script](https://gist.github.com/m-rousse/30adf5ec761b0909fa2fcfe799a492d9) pour déchiffrer les identifiants de touche et afficher la touche correspondante. (On a utilisé pour ça les données contenues sur le site de [FreeBSDDiaries](http://www.freebsddiary.org/APC/usb_hid_usages.php)).

Pour simplifier le script, on a nettoyé la capture avant de la traiter en supprimant toutes les colonnes inutiles en bash : `cat capture.txt |  cut -d" " -f10 | cut -d":" -f10 > keycodes.txt`
On peut alors observer notre victime sur DC Admin se connecter sur un site (encore un bit.ly) et entrer ses identifiants : admin/952099167.
Une fois n'est pas coutume, on suit le lien et utilisons les identifiants fraichement récoltés.
On obtient une photo nous indiquant que le Nano Cache est positionné sur une barre métallique verticale. On range notre matériel à la hâte, puis on court devant la Crash Party, où derrière un Kakemono on découvre le conteneur. On est à la fois partagés entre joie, haine et surprise : on est CERTAINS d'avoir cherché à cet endroit pourtant.
Trêve de bavardages, on l'ouvre et découvre alors un QRCode, bien trop petit pour que nos téléphone ne réussisse à le lire. On l'a alors photographié, puis scanné depuis un autre téléphone après zoom.
{% lightbox ndhXVbbc-step2.jpg %}
Il nous mène de nouveau vers un lien Bit.ly, qui pointe sur le site de Virtualabs, où l'on trouve un fichier.hex nommé `nrf51822_qfaa_s130.hex`, nous entraînant dans la 3ème et dernière partie du challenge.

# Étape trois : [Ingénieurie à rebours](http://bitoduc.fr/#ang-fra-R) du micrologiciel

À 3h30, on s'équipe de notre cagoule et nos gants, prêts à reverser le firmware du supposé BlackBadge. Plus qu'à s'imprégner de [8 Bit Weapon](https://8bitweapon.bandcamp.com/album/disassembly-language-ambient-music-for-deprogramming-vol-1) puis nous voici lancés.

Le fichier du firmware nous est proposé au format .hex, qui représente le firmware en utilisant des caractères ASCII. Notre équipe étant équipé d'un toolchain ARM GNU sur sa machine, on utilise la commande objdump pour faire la conversion `.hex` vers `.bin` pour pouvoir charger le firmware dans IDA.

Une première analyse du binaire avec `strings` nous révèle la chaine de caractères `WantBlackBadge?`, corroborant ainsi la provenance du firmware, mais malheureusement ne nous donne pas d'indice croustillant pour notre reverse engineering. On tente ensuite de l'observer avec `binwalk`, mais nous trouvons bredouille avec une pauvre signature SHA256.

On tente la seule (et longue) option à notre disposition : désassembler le firmware, et analyser son code. Nous lançons donc notre outil de RE fétiche, IDA. Les paramètres pour charger le fichier doivent être soigneusement choisi : on choisit déjà comme architecture "ARM, Little Endian", puis on ajuste l'adresse de début de la RAM/ROM en fonction des paramètre linker utilisés dans le [projet OpenLys](https://github.com/virtualabs/openlys/blob/master/gablys/s130/armgcc/ble_app_ndhxv_gcc_nrf51.ld) (qui au passage nous apprendra beaucoup sur la structure du firmware que nous analysons).

Manquant d'expérience dans la discipline, nous avons principalement tâtonné et après quelques remémorations de la talk de Virtu, on décide de se baser sur les instructions `SVC` (syscalls) qui appellent le SoftDevice de Nordic. L'identification de l'utilité de ces syscalls nous permet de déterminer rapidement quelle fonction BLE est appelée par le code. La documentation de l'[API BLE du nrf51822](https://developer.nordicsemi.com/nRF5_SDK/nRF51_SDK_v8.x.x/doc/8.1.0/s130/html/a01019.html) est d'une très grande aide, en particulier toutes les sections "Enumerations". On commence à déceler un peu de structure dans le code assembleur et à identifier quelques subroutines.

On cherche à trouver des morceaux de codes servant à l'initialisation du BLE, où seraient définis les callbacks appelés en cas de réception de paquet BLE (avec notamment le SVC `SD_BLE_GATTS_SERVICE_ADD`).

L'heure très matinale n'aidant pas, après plusieurs dizaines de minutes de recherches hasardeuses nous nous rappelons tardivement que IDA dispose d'une fonction décompilateur, qui est plutôt efficace, même sur du code ARM. L'identification des subroutines appelant les SVC nous est énormément utile et nous permet de mettre la main sur une subroutine gérant de la réception et de l'émission de paquet Bluetooth. Nous savons que c'est ici que tout se joue.

{% lightbox ndhXVbbc-step3.png %}

Une condition "if" détecte la présence de caractère "S", "A", "5", "f", et "W", et fait appel à d'autres fonctions déterminer si le firmware doit répondre avec le flag ou non. Sur le moment (et pendant un bon bout de temps), nous pensions que ces caractères étaient côte à côte dans la chaîne de caractère à envoyer. En swappant les quatre premiers caractères, nous tombons même sur ce qui semblerait être un identifiant de radio-amateur français. Finalement nous nous rendons compte que ces caractères sont espacés d'un octet.

{% lightbox ndhXVbbc-step3-2.png %}

La condition teste aussi l'égalité du SHA256 du paquet reçu avec un SHA256 en mémoire (celui vu avec Binwalk), nous aurions pu tenter le bruteforce mais n'avions pas le temps. Nous tentons donc deviner les lettres nécessaires. Ce sera finalement : "SHA256fTW". En envoyant cette chaîne sur un des services du badge de Virtualabs, il nous retourne la chaîne  "/HwR3ver5eR0xX0r". On reconstruit alors l'URL `http://virtualabs.fr/ndhxv/HwR3ver5eR0xX0r`. Un énième correctif après, le code source de la page nous indique comme élément de réponse final du challenge : "I am The Plague" (en référence à Hackerz).

# Conclusion

La NdHXV aura été intense, et le Black Badge Challenge passionnant.
Nous tenons tout particulièrement à remercier [@virtualabs](https://twitter.com/virtualabs), [@marcolanie](https://twitter.com/marcolanie) et [@f4grx](https://twitter.com/f4grx) pour la conception de ce challenge qui nous aura tenu en haleine de 17h à 8h sans interruption.
Comme chaque année depuis 5 ans que nous nous y rendons, la NdH est un super moment de rencontres et de challenges, nous ne saurions remercier assez [@hackerzvoice](https://twitter.com/hackerzvoice) et [@sysdream](https://twitter.com/sysdream) pour l'organisation de l'évènement.
À l'année prochaine !

[Amré](https://twitter.com/AmreABOUALI)
[Jean](https://tibounise.com/)
[Mathieu](https://twitter.com/roussemath)
et Thibault
