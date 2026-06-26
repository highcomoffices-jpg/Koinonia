/*
  # Insertion Complète des Données - Koinonia Platform
  
  Ce script insère toutes les données d'exemple pour la plateforme Koinonia.
  Tous les utilisateurs sont créés avec des profils authentiques du Bénin.
  
  Ordre d'exécution :
  1. Données géographiques
  2. Données religieuses
  3. Profils utilisateurs (Béninois d'abord)
  4. Données dépendantes des utilisateurs
*/

-- =====================================================
-- 1. GÉOGRAPHIE - CONTINENTS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM continents WHERE code = 'AF') THEN
    INSERT INTO continents (name, code) VALUES
    ('Afrique', 'AF'),
    ('Europe', 'EU'),
    ('Amérique du Nord', 'NA'),
    ('Amérique du Sud', 'SA'),
    ('Asie', 'AS'),
    ('Océanie', 'OC');
  END IF;
END $$;

-- =====================================================
-- 2. GÉOGRAPHIE - SOUS-RÉGIONS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sub_regions LIMIT 1) THEN
    INSERT INTO sub_regions (name, continent_id) 
    SELECT 
      sr.name,
      c.id
    FROM (VALUES
      ('Afrique de l''Ouest', 'AF'),
      ('Afrique Centrale', 'AF'),
      ('Afrique de l''Est', 'AF'),
      ('Europe de l''Ouest', 'EU'),
      ('Europe du Sud', 'EU')
    ) AS sr(name, continent_code)
    JOIN continents c ON c.code = sr.continent_code;
  END IF;
END $$;

-- =====================================================
-- 3. GÉOGRAPHIE - PAYS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM countries WHERE code = 'BJ') THEN
    INSERT INTO countries (name, code, continent_id, sub_region_id) 
    SELECT 
      c.name,
      c.code,
      ct.id,
      sr.id
    FROM (VALUES
      ('Bénin', 'BJ', 'Afrique', 'Afrique de l''Ouest'),
      ('Sénégal', 'SN', 'Afrique', 'Afrique de l''Ouest'),
      ('France', 'FR', 'Europe', 'Europe de l''Ouest'),
      ('République Démocratique du Congo', 'CD', 'Afrique', 'Afrique Centrale'),
      ('Kenya', 'KE', 'Afrique', 'Afrique de l''Est')
    ) AS c(name, code, continent_name, sub_region_name)
    JOIN continents ct ON ct.name = c.continent_name
    JOIN sub_regions sr ON sr.name = c.sub_region_name;
  END IF;
END $$;

-- =====================================================
-- 4. GÉOGRAPHIE - VILLES
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Cotonou') THEN
    INSERT INTO cities (name, country_id) 
    SELECT 
      city.name,
      c.id
    FROM (VALUES
      -- Bénin
      ('Cotonou', 'BJ'),
      ('Porto-Novo', 'BJ'),
      ('Parakou', 'BJ'),
      ('Djougou', 'BJ'),
      ('Bohicon', 'BJ'),
      ('Kandi', 'BJ'),
      ('Lokossa', 'BJ'),
      ('Ouidah', 'BJ'),
      ('Abomey', 'BJ'),
      ('Natitingou', 'BJ'),
      -- Sénégal
      ('Dakar', 'SN'),
      ('Saint-Louis', 'SN'),
      ('Thiès', 'SN'),
      ('Kaolack', 'SN'),
      ('Ziguinchor', 'SN'),
      -- France
      ('Paris', 'FR'),
      ('Lyon', 'FR'),
      ('Marseille', 'FR'),
      ('Toulouse', 'FR'),
      ('Nice', 'FR'),
      -- RDC
      ('Kinshasa', 'CD'),
      ('Lubumbashi', 'CD'),
      ('Mbuji-Mayi', 'CD'),
      ('Kisangani', 'CD'),
      -- Kenya
      ('Nairobi', 'KE'),
      ('Mombasa', 'KE'),
      ('Kisumu', 'KE'),
      ('Nakuru', 'KE')
    ) AS city(name, country_code)
    JOIN countries c ON c.code = city.country_code;
  END IF;
END $$;

-- =====================================================
-- 5. CONFESSIONS RELIGIEUSES
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM confessions WHERE name = 'Catholique') THEN
    INSERT INTO confessions (name, description, validated) VALUES
    ('Catholique', 'Église Catholique Romaine', true),
    ('Protestant', 'Églises Protestantes', true),
    ('Orthodoxe', 'Églises Orthodoxes', true),
    ('Évangélique', 'Églises Évangéliques', true),
    ('Pentecôtiste', 'Églises Pentecôtistes', true),
    ('Baptiste', 'Églises Baptistes', true),
    ('Méthodiste', 'Églises Méthodistes', true),
    ('Adventiste', 'Église Adventiste du Septième Jour', true),
    ('Presbytérienne', 'Églises Presbytériennes', true),
    ('Anglicane', 'Communion Anglicane', true);
  END IF;
END $$;

-- =====================================================
-- 6. PAROISSES
-- =====================================================

DO $$ 
DECLARE
  cotonou_id uuid;
  portonovo_id uuid;
  parakou_id uuid;
  ouidah_id uuid;
  dakar_id uuid;
  paris_id uuid;
  kinshasa_id uuid;
  nairobi_id uuid;
  catholique_id uuid;
  protestant_id uuid;
  evangelique_id uuid;
  pentecotiste_id uuid;
  baptiste_id uuid;
  methodiste_id uuid;
BEGIN
  -- Récupérer les IDs des villes
  SELECT id INTO cotonou_id FROM cities WHERE name = 'Cotonou';
  SELECT id INTO portonovo_id FROM cities WHERE name = 'Porto-Novo';
  SELECT id INTO parakou_id FROM cities WHERE name = 'Parakou';
  SELECT id INTO ouidah_id FROM cities WHERE name = 'Ouidah';
  SELECT id INTO dakar_id FROM cities WHERE name = 'Dakar';
  SELECT id INTO paris_id FROM cities WHERE name = 'Paris';
  SELECT id INTO kinshasa_id FROM cities WHERE name = 'Kinshasa';
  SELECT id INTO nairobi_id FROM cities WHERE name = 'Nairobi';
  
  -- Récupérer les IDs des confessions
  SELECT id INTO catholique_id FROM confessions WHERE name = 'Catholique';
  SELECT id INTO protestant_id FROM confessions WHERE name = 'Protestant';
  SELECT id INTO evangelique_id FROM confessions WHERE name = 'Évangélique';
  SELECT id INTO pentecotiste_id FROM confessions WHERE name = 'Pentecôtiste';
  SELECT id INTO baptiste_id FROM confessions WHERE name = 'Baptiste';
  SELECT id INTO methodiste_id FROM confessions WHERE name = 'Méthodiste';
  
  IF NOT EXISTS (SELECT 1 FROM parishes WHERE name = 'Cathédrale Notre-Dame de Miséricorde') THEN
    INSERT INTO parishes (name, confession_id, city_id, address, validated) VALUES
    -- Cotonou - Bénin
    ('Cathédrale Notre-Dame de Miséricorde', catholique_id, cotonou_id, 'Boulevard de la Marina, Cotonou', true),
    ('Paroisse Saint-Michel', catholique_id, cotonou_id, 'Quartier Akpakpa, Cotonou', true),
    ('Église Saint-Antoine de Padoue', catholique_id, cotonou_id, 'Quartier Cadjehoun, Cotonou', true),
    ('Temple Protestant Méthodiste', methodiste_id, cotonou_id, 'Avenue Clozel, Cotonou', true),
    ('Église Évangélique du Bénin', evangelique_id, cotonou_id, 'Quartier Godomey, Cotonou', true),
    ('Assemblée de Dieu Cotonou', pentecotiste_id, cotonou_id, 'Quartier Fidjrossè, Cotonou', true),
    ('Église Baptiste Emmanuel', baptiste_id, cotonou_id, 'Quartier Dantokpa, Cotonou', true),
    -- Porto-Novo - Bénin
    ('Cathédrale de l''Immaculée Conception', catholique_id, portonovo_id, 'Centre-ville, Porto-Novo', true),
    ('Église Protestante Méthodiste', methodiste_id, portonovo_id, 'Quartier Tokpota, Porto-Novo', true),
    -- Parakou - Bénin
    ('Paroisse Saint-Pierre de Parakou', catholique_id, parakou_id, 'Centre-ville, Parakou', true),
    ('Église Évangélique de Parakou', evangelique_id, parakou_id, 'Quartier Banikanni, Parakou', true),
    -- Ouidah - Bénin
    ('Basilique de l''Immaculée Conception', catholique_id, ouidah_id, 'Centre historique, Ouidah', true),
    -- Dakar - Sénégal
    ('Cathédrale du Souvenir Africain', catholique_id, dakar_id, 'Plateau, Dakar', true),
    ('Église Saint-Joseph', catholique_id, dakar_id, 'Médina, Dakar', true),
    ('Paroisse Sainte-Anne', catholique_id, dakar_id, 'Fann, Dakar', true),
    ('Temple Protestant de Dakar', protestant_id, dakar_id, 'Point E, Dakar', true),
    ('Église Évangélique de Réveil', evangelique_id, dakar_id, 'Liberté 6, Dakar', true),
    ('Assemblée de Dieu Dakar', pentecotiste_id, dakar_id, 'Parcelles Assainies, Dakar', true),
    ('Église Baptiste Béthel', baptiste_id, dakar_id, 'Ouakam, Dakar', true),
    -- Paris - France
    ('Notre-Dame de Paris', catholique_id, paris_id, 'Île de la Cité, Paris', true),
    ('Église Saint-Sulpice', catholique_id, paris_id, '6e arrondissement, Paris', true),
    ('Église Protestante Unie de France', protestant_id, paris_id, 'Rue de Rivoli, Paris', true),
    ('Église Évangélique de Belleville', evangelique_id, paris_id, '20e arrondissement, Paris', true),
    -- Kinshasa - RDC
    ('Cathédrale Notre-Dame du Congo', catholique_id, kinshasa_id, 'Gombe, Kinshasa', true),
    ('Église du Christ au Congo', protestant_id, kinshasa_id, 'Kalamu, Kinshasa', true),
    ('Assemblée Chrétienne de Kinshasa', pentecotiste_id, kinshasa_id, 'Lemba, Kinshasa', true),
    -- Nairobi - Kenya
    ('Holy Family Cathedral', catholique_id, nairobi_id, 'City Centre, Nairobi', true),
    ('All Saints Cathedral', (SELECT id FROM confessions WHERE name = 'Anglicane'), nairobi_id, 'Uhuru Highway, Nairobi', true),
    ('Nairobi Baptist Church', baptiste_id, nairobi_id, 'Ngong Road, Nairobi', true);
  END IF;
END $$;

-- =====================================================
-- 7. PROFILS UTILISATEURS (Béninois d'abord)
-- =====================================================

DO $$ 
DECLARE
  benin_id uuid;
  cotonou_id uuid;
  portonovo_id uuid;
  parakou_id uuid;
  ouidah_id uuid;
  bohicon_id uuid;
  djougou_id uuid;
  abomey_id uuid;
  senegal_id uuid;
  france_id uuid;
  catholique_id uuid;
  evangelique_id uuid;
  protestant_id uuid;
  pentecotiste_id uuid;
  baptiste_id uuid;
  methodiste_id uuid;
  cathedrale_id uuid;
BEGIN
  -- Récupérer les IDs nécessaires des pays
  SELECT id INTO benin_id FROM countries WHERE name = 'Bénin';
  SELECT id INTO senegal_id FROM countries WHERE name = 'Sénégal';
  SELECT id INTO france_id FROM countries WHERE name = 'France';
  
  -- Récupérer les IDs nécessaires des villes
  SELECT id INTO cotonou_id FROM cities WHERE name = 'Cotonou';
  SELECT id INTO portonovo_id FROM cities WHERE name = 'Porto-Novo';
  SELECT id INTO parakou_id FROM cities WHERE name = 'Parakou';
  SELECT id INTO ouidah_id FROM cities WHERE name = 'Ouidah';
  SELECT id INTO bohicon_id FROM cities WHERE name = 'Bohicon';
  SELECT id INTO djougou_id FROM cities WHERE name = 'Djougou';
  SELECT id INTO abomey_id FROM cities WHERE name = 'Abomey';
  
  -- Récupérer les IDs nécessaires des confessions
  SELECT id INTO catholique_id FROM confessions WHERE name = 'Catholique';
  SELECT id INTO evangelique_id FROM confessions WHERE name = 'Évangélique';
  SELECT id INTO protestant_id FROM confessions WHERE name = 'Protestant';
  SELECT id INTO pentecotiste_id FROM confessions WHERE name = 'Pentecôtiste';
  SELECT id INTO baptiste_id FROM confessions WHERE name = 'Baptiste';
  SELECT id INTO methodiste_id FROM confessions WHERE name = 'Méthodiste';
  
  -- Récupérer les IDs nécessaires des paroisses
  SELECT id INTO cathedrale_id FROM parishes WHERE name = 'Cathédrale Notre-Dame de Miséricorde';
  
  -- Vérifier si les profils existent déjà
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'modestegando@gmail.com') THEN
    -- Insertion des profils avec les vrais IDs des utilisateurs
    INSERT INTO profiles (id, email, first_name, last_name, profile_complete, role, level, country_id, city_id, confession_id, parish_id, bio) VALUES
    -- Administrateurs et responsables (Cotonou)
    ('423cf95c-1b08-499f-ba48-3e9b9c829d18', 'modestegando@gmail.com', 'Modeste', 'Gando', true, 'admin', 'berger', benin_id, cotonou_id, catholique_id, cathedrale_id, 'Prêtre catholique à la Cathédrale de Cotonou. Passionné par l''évangélisation et la jeunesse.'),
    ('0636da43-a93c-40a7-9249-6b154f9ecc37', 'catherinelawani@gmail.com', 'Catherine', 'Lawani', true, 'vigneron', 'berger', benin_id, cotonou_id, catholique_id, cathedrale_id, 'Responsable de la catéchèse. Mère de 3 enfants. Engagée dans la vie paroissiale depuis 15 ans.'),
    ('d6bb5947-742c-4f7b-a72c-fc1b6cc941ce', 'emmanuelgando@gmail.com', 'Emmanuel', 'Gando', true, 'vigneron', 'moissonneur', benin_id, cotonou_id, evangelique_id, (SELECT id FROM parishes WHERE name = 'Église Évangélique du Bénin'), 'Pasteur évangélique. Enseignant biblique et conférencier.'),
    ('923d04b0-c4bc-48ef-a8de-695b3a5fd5eb', 'mariemelckiss@gmail.com', 'Marie', 'Melckiss', true, 'vigneron', 'moissonneur', benin_id, cotonou_id, catholique_id, cathedrale_id, 'Directrice de chorale. Musicienne et compositrice de chants religieux.'),
    
    -- Membres actifs (Cotonou)
    ('3e7567e4-84b2-4ab8-aebe-08cd9e27ccd7', 'marieconsolation@gmail.com', 'Marie', 'Consolation', true, 'brebis', 'semeur', benin_id, cotonou_id, catholique_id, cathedrale_id, 'Étudiante en théologie. Responsable des jeunes de la paroisse.'),
    ('accfddc2-1889-4603-a795-4bf4c9d61726', 'mariejohannique@gmail.com', 'Marie', 'Johannique', true, 'brebis', 'moissonneur', benin_id, cotonou_id, protestant_id, (SELECT id FROM parishes WHERE name = 'Temple Protestant Méthodiste'), 'Infirmière de profession. Membre active du groupe de prière.'),
    ('1faa5477-30cc-48dc-968a-3ed10dc6578b', 'rodiath@gmail.com', 'Rodiath', 'Gandonou', true, 'brebis', 'semeur', benin_id, cotonou_id, evangelique_id, (SELECT id FROM parishes WHERE name = 'Église Évangélique du Bénin'), 'Entrepreneure. Fondatrice d''une entreprise sociale chrétienne.'),
    ('8efad3d8-87b4-499c-895b-cb567801931a', 'karamatou@gmail.com', 'Karamatou', 'Salami', true, 'brebis', 'semeur', benin_id, cotonou_id, catholique_id, cathedrale_id, 'Mère au foyer. Responsable de l''accueil à la paroisse.'),
    ('42687670-66fc-46b6-9793-8d000d3bcbbd', 'martory@gmail.com', 'Martory', 'Dossou', true, 'brebis', 'moissonneur', benin_id, cotonou_id, pentecotiste_id, (SELECT id FROM parishes WHERE name = 'Assemblée de Dieu Cotonou'), 'Enseignant. Responsable de l''école du dimanche.'),
    ('b792b4b4-1019-4ca0-a933-aabe84d2f8de', 'saens@gmail.com', 'Saens', 'Kouagou', true, 'brebis', 'semeur', benin_id, cotonou_id, baptiste_id, (SELECT id FROM parishes WHERE name = 'Église Baptiste Emmanuel'), 'Étudiante en médecine. Membre de la chorale des jeunes.'),
    
    -- Porto-Novo
    ('4c62b96d-4958-47d3-9a05-2798ac9dca77', 'berenice@gmail.com', 'Bérénice', 'Yahouédéou', true, 'vigneron', 'moissonneur', benin_id, portonovo_id, catholique_id, (SELECT id FROM parishes WHERE name = 'Cathédrale de l''Immaculée Conception'), 'Prêtre à Porto-Novo. Historienne des religions africaines.'),
    ('33fffb9d-8403-478e-848c-7b0fed17d7ee', 'petronille@gmail.com', 'Pétronille', 'Zannou', true, 'brebis', 'semeur', benin_id, portonovo_id, methodiste_id, (SELECT id FROM parishes WHERE name = 'Église Protestante Méthodiste'), 'Commerçante au marché Dantokpa. Femme de foi engagée.'),
    
    -- Parakou
    ('de3dc06a-d360-4894-8707-3b443ecfa9d4', 'reyhector@gmail.com', 'Rey', 'Hector', true, 'vigneron', 'moissonneur', benin_id, parakou_id, catholique_id, (SELECT id FROM parishes WHERE name = 'Paroisse Saint-Pierre de Parakou'), 'Pasteur à Parakou. Spécialiste en counseling familial.'),
    
    -- Ouidah
    ('2a446046-4d77-4cbe-ba8d-f32499d68ea2', 'olgapatricia@gmail.com', 'Olga-Patricia', 'Djogbenou', true, 'brebis', 'semeur', benin_id, ouidah_id, catholique_id, (SELECT id FROM parishes WHERE name = 'Basilique de l''Immaculée Conception'), 'Guide touristique chrétienne à Ouidah.'),
    
    -- Bohicon
    ('98eecc53-77ac-4232-9d94-e34ffeaab233', 'dorine@gmail.com', 'Dorine', 'Houngbedji', true, 'brebis', 'semeur', benin_id, bohicon_id, evangelique_id, NULL, 'Agricultrice chrétienne. Productrice de maïs et de manioc.'),
    
    -- Djougou
    ('8238e517-4c65-4ae4-ac82-6ce2dadf4403', 'esperancia@gmail.com', 'Espérancia', 'Tchibozo', true, 'brebis', 'semeur', benin_id, djougou_id, catholique_id, NULL, 'Enseignante à Djougou. Catéchiste depuis 10 ans.'),
    
    -- Abomey
    ('596aabeb-f2a0-4c6b-a43b-fba63a16d75e', 'victorien@gmail.com', 'Victorien', 'Houessou', true, 'brebis', 'semeur', benin_id, abomey_id, protestant_id, NULL, 'Artisan. Fabrique des objets d''art chrétiens.'),
    
    -- Sénégal (Dakar)
    ('4473a719-5d12-4582-a59a-1a66330780cc', 'mavie@gmail.com', 'Mavie', 'Ndiaye', true, 'brebis', 'moissonneur', senegal_id, (SELECT id FROM cities WHERE name = 'Dakar'), catholique_id, (SELECT id FROM parishes WHERE name = 'Cathédrale du Souvenir Africain'), 'Étudiante sénégalaise en France. Membre active de la diaspora.'),
    
    -- France (Paris)
    ('b996d8a3-0a8e-4795-b9cd-98e66e0190d0', 'yves@gmail.com', 'Yves', 'Legrand', true, 'brebis', 'semeur', france_id, (SELECT id FROM cities WHERE name = 'Paris'), catholique_id, (SELECT id FROM parishes WHERE name = 'Notre-Dame de Paris'), 'Français d''origine béninoise. Étudiant en sciences politiques.'),
    ('7d14d281-2ae8-49f6-ad59-deaadb148578', 'carlos@gmail.com', 'Carlos', 'Santos', true, 'brebis', 'semeur', france_id, (SELECT id FROM cities WHERE name = 'Paris'), catholique_id, (SELECT id FROM parishes WHERE name = 'Notre-Dame de Paris'), 'Étudiant brésilien à Paris. Chercheur en théologie comparative.');
    
  END IF;
  
  -- Vérification
  RAISE NOTICE '✅ Profils utilisateurs insérés avec succès !';
  RAISE NOTICE '   - Nombre de profils: %', (SELECT COUNT(*) FROM profiles);
END $$;

-- =====================================================
-- 8. ARTICLES DU MARCHÉ
-- =====================================================

DO $$ 
DECLARE
  modeste_id uuid;
  catherine_id uuid;
  emmanuel_id uuid;
  marie_m_id uuid;
  marie_c_id uuid;
  marie_j_id uuid;
  rodiath_id uuid;
  karamatou_id uuid;
  martory_id uuid;
  saens_id uuid;
  berenice_id uuid;
  petronille_id uuid;
BEGIN
  -- Récupérer les IDs des vendeurs (correspondance avec les nouveaux emails)
  SELECT id INTO modeste_id FROM profiles WHERE email = 'modestegando@gmail.com';
  SELECT id INTO catherine_id FROM profiles WHERE email = 'catherinelawani@gmail.com';
  SELECT id INTO emmanuel_id FROM profiles WHERE email = 'emmanuelgando@gmail.com';
  SELECT id INTO marie_m_id FROM profiles WHERE email = 'mariemelckiss@gmail.com';
  SELECT id INTO marie_c_id FROM profiles WHERE email = 'marieconsolation@gmail.com';
  SELECT id INTO marie_j_id FROM profiles WHERE email = 'mariejohannique@gmail.com';
  SELECT id INTO rodiath_id FROM profiles WHERE email = 'rodiath@gmail.com';
  SELECT id INTO karamatou_id FROM profiles WHERE email = 'karamatou@gmail.com';
  SELECT id INTO martory_id FROM profiles WHERE email = 'martory@gmail.com';
  SELECT id INTO saens_id FROM profiles WHERE email = 'saens@gmail.com';
  SELECT id INTO berenice_id FROM profiles WHERE email = 'berenice@gmail.com';
  SELECT id INTO petronille_id FROM profiles WHERE email = 'petronille@gmail.com';
  
  IF NOT EXISTS (SELECT 1 FROM market_items LIMIT 1) THEN
    INSERT INTO market_items (seller_id, title, description, category, price, condition, location, image_url, likes, is_active) VALUES
    -- Modeste (admin) - Bible
    (modeste_id, 'Bible d''étude MacArthur - Français', 'Bible d''étude complète avec commentaires détaillés. Excellent état, très peu utilisée. Parfaite pour l''étude approfondie des Écritures.', 'books', 25000, 'Très bon état', 'Cotonou, Bénin', 'https://images.pexels.com/photos/1112048/pexels-photo-1112048.jpeg?auto=compress&cs=tinysrgb&w=400', 12, true),
    -- Catherine (vigneron) - CD louange
    (catherine_id, 'CD de louange - Hillsong United', 'Collection de 5 CDs de Hillsong United incluant les plus grands hits. Musique de qualité pour vos moments de louange personnels et communautaires.', 'music', 15000, 'Bon état', 'Cotonou, Bénin', 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400', 8, true),
    -- Emmanuel (pasteur évangélique) - Croix artisanale
    (emmanuel_id, 'Croix artisanale en bois d''ébène', 'Magnifique croix sculptée à la main par un artisan local béninois. Bois d''ébène authentique. Parfaite pour décoration murale ou cadeau.', 'crafts', 8000, 'Neuf', 'Cotonou, Bénin', 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=400', 15, true),
    -- Marie M (directrice chorale) - T-shirt
    (marie_m_id, 'T-shirt "Jesus is my Savior"', 'T-shirt de qualité avec message chrétien inspirant. Taille M, 100% coton. Idéal pour témoigner de sa foi au quotidien.', 'clothing', 5000, 'Neuf', 'Cotonou, Bénin', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400', 6, true),
    -- Marie C (étudiante théologie) - Cours guitare
    (marie_c_id, 'Cours de guitare pour louange', 'Professeur de musique chrétien propose des cours de guitare spécialisés dans la louange et l''adoration. Tous niveaux acceptés.', 'services', 10000, NULL, 'Cotonou, Bénin', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=400', 20, true),
    -- Marie J (infirmière) - Retraite spirituelle
    (marie_j_id, 'Retraite spirituelle - Lac Nokoué', 'Week-end de retraite spirituelle au bord du Lac Nokoué. Programme : prières, méditations, enseignements bibliques et communion fraternelle.', 'events', 35000, NULL, 'Lac Nokoué, Bénin', 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400', 25, true),
    -- Rodiath (entrepreneure) - Collecte orphelinat
    (rodiath_id, 'Collecte pour orphelinat chrétien', 'Collecte de fonds pour soutenir l''orphelinat "Espoir des Enfants" à Cotonou. Les dons serviront à acheter des fournitures scolaires et de la nourriture.', 'donations', 0, NULL, 'Cotonou, Bénin', 'https://images.pexels.com/photos/1624504/pexels-photo-1624504.jpeg?auto=compress&cs=tinysrgb&w=400', 42, true),
    -- Karamatou (mère au foyer) - Livre méditations
    (karamatou_id, 'Livre "Jésus t''appelle" - Sarah Young', 'Livre de méditations quotidiennes très inspirant. 365 jours de réflexions spirituelles pour approfondir votre relation avec Jésus.', 'books', 12000, 'Bon état', 'Cotonou, Bénin', 'https://images.pexels.com/photos/1112048/pexels-photo-1112048.jpeg?auto=compress&cs=tinysrgb&w=400', 9, true),
    -- Martory (enseignant) - Bracelet
    (martory_id, 'Bracelet avec verset biblique', 'Bracelet en cuir avec verset Jean 3:16 gravé. Accessoire de foi discret et élégant pour hommes et femmes.', 'clothing', 3000, 'Neuf', 'Cotonou, Bénin', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400', 7, true),
    -- Saens (étudiante médecine) - Service traduction
    (saens_id, 'Service de traduction biblique', 'Traductrice professionnelle propose ses services pour traduire des textes bibliques et documents chrétiens du français vers le fon et le yoruba.', 'services', 2000, NULL, 'Cotonou, Bénin', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=400', 14, true),
    -- Bérénice (Porto-Novo) - Masque traditionnel
    (berenice_id, 'Masque traditionnel béninois chrétien', 'Masque artisanal béninois avec symboles chrétiens intégrés. Œuvre d''art culturelle unique réalisée par un artisan expérimenté de Porto-Novo.', 'crafts', 45000, 'Neuf', 'Porto-Novo, Bénin', 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=400', 18, true),
    -- Pétronille (Porto-Novo) - Album chants
    (petronille_id, 'Album de chants traditionnels béninois chrétiens', 'Compilation de chants chrétiens traditionnels béninois en fon et yoruba. Musique authentique pour enrichir vos moments de louange culturelle.', 'music', 8000, 'Neuf', 'Porto-Novo, Bénin', 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=400', 11, true);
  END IF;
  
  RAISE NOTICE '✅ Articles du marché insérés avec succès !';
END $$;

-- =====================================================
-- 9. SERVICES
-- =====================================================

DO $$ 
DECLARE
  modeste_id uuid;
  catherine_id uuid;
  catholique_id uuid;
  protestant_id uuid;
  evangelique_id uuid;
  cathedrale_id uuid;
BEGIN
  SELECT id INTO modeste_id FROM profiles WHERE email = 'modestegando@gmail.com';
  SELECT id INTO catherine_id FROM profiles WHERE email = 'catherinelawani@gmail.com';
  SELECT id INTO catholique_id FROM confessions WHERE name = 'Catholique';
  SELECT id INTO protestant_id FROM confessions WHERE name = 'Protestant';
  SELECT id INTO evangelique_id FROM confessions WHERE name = 'Évangélique';
  SELECT id INTO cathedrale_id FROM parishes WHERE name = 'Cathédrale Notre-Dame de Miséricorde';
  
  IF NOT EXISTS (SELECT 1 FROM services LIMIT 1) THEN
    INSERT INTO services (provider_id, title, description, type, confession_ids, parish_id, price, duration, is_active) VALUES
    (modeste_id, 'Demande de Messe d''intention', 'Demandez une messe pour vos intentions particulières : défunts, malades, actions de grâce, etc. Notre prêtre célébrera la messe selon vos intentions.', 'mass_request', ARRAY[catholique_id], cathedrale_id, 5000, '30 minutes', true),
    (catherine_id, 'Confession et Direction spirituelle', 'Rendez-vous pour le sacrement de réconciliation et accompagnement spirituel personnalisé avec un prêtre expérimenté.', 'confession', ARRAY[catholique_id], cathedrale_id, NULL, '45 minutes', true),
    (modeste_id, 'Messe en direct - Dimanche', 'Suivez la messe dominicale en direct depuis votre domicile. Communion spirituelle et participation active à la liturgie.', 'live_stream', ARRAY[catholique_id], cathedrale_id, NULL, '1h 30min', true),
    (modeste_id, 'Conseil pastoral et accompagnement', 'Séance de conseil pastoral pour les couples, familles ou individus traversant des difficultés spirituelles ou personnelles.', 'counseling', ARRAY[protestant_id, evangelique_id], NULL, 8000, '1 heure', true);
  END IF;
  
  RAISE NOTICE '✅ Services insérés avec succès !';
END $$;

-- =====================================================
-- 10. FORMATIONS
-- =====================================================

DO $$ 
DECLARE
  emmanuel_id uuid;
  marie_m_id uuid;
  marie_c_id uuid;
  marie_j_id uuid;
  rodiath_id uuid;
BEGIN
  SELECT id INTO emmanuel_id FROM profiles WHERE email = 'emmanuelgando@gmail.com';
  SELECT id INTO marie_m_id FROM profiles WHERE email = 'mariemelckiss@gmail.com';
  SELECT id INTO marie_c_id FROM profiles WHERE email = 'marieconsolation@gmail.com';
  SELECT id INTO marie_j_id FROM profiles WHERE email = 'mariejohannique@gmail.com';
  SELECT id INTO rodiath_id FROM profiles WHERE email = 'rodiath@gmail.com';
  
  IF NOT EXISTS (SELECT 1 FROM formations LIMIT 1) THEN
    INSERT INTO formations (instructor_id, title, description, category, price, duration, max_students, is_active) VALUES
    (emmanuel_id, 'Éducation chrétienne des enfants en famille', 'Formation complète pour les parents chrétiens souhaitant transmettre efficacement les valeurs chrétiennes à leurs enfants. Méthodes pratiques et bibliques adaptées au contexte africain moderne.', 'family_education', 25000, '6 semaines', 50, true),
    (marie_m_id, 'Vie de couple selon les Écritures', 'Parcours de formation pour couples chrétiens : communication, résolution de conflits, intimité spirituelle et construction d''un foyer solide. Renforcez votre union par la Parole de Dieu.', 'couple_life', 35000, '8 semaines', 30, true),
    (marie_c_id, 'Leadership chrétien et service', 'Développez vos compétences de leadership selon les principes bibliques. Formation destinée aux responsables d''église et ministères. Apprenez à diriger avec humilité, sagesse et efficacité.', 'leadership', 45000, '10 semaines', 25, true),
    (marie_j_id, 'Évangélisation moderne et témoignage', 'Apprenez les techniques modernes d''évangélisation adaptées au contexte béninois et africain. Formation pratique avec mise en situation réelle.', 'evangelization', 20000, '4 semaines', 40, true),
    (rodiath_id, 'Théologie pratique pour serviteurs', 'Formation théologique approfondie pour les serviteurs et futurs pasteurs. Étude systématique des doctrines chrétiennes avec application pratique.', 'theology', 55000, '12 semaines', 20, true);
  END IF;
  
  RAISE NOTICE '✅ Formations insérées avec succès !';
END $$;

-- =====================================================
-- 11. GROUPES
-- =====================================================

DO $$ 
DECLARE
  marie_c_id uuid;
  karamatou_id uuid;
  martory_id uuid;
  saens_id uuid;
  catholique_id uuid;
  protestant_id uuid;
  evangelique_id uuid;
BEGIN
  SELECT id INTO marie_c_id FROM profiles WHERE email = 'marieconsolation@gmail.com';
  SELECT id INTO karamatou_id FROM profiles WHERE email = 'karamatou@gmail.com';
  SELECT id INTO martory_id FROM profiles WHERE email = 'martory@gmail.com';
  SELECT id INTO saens_id FROM profiles WHERE email = 'saens@gmail.com';
  SELECT id INTO catholique_id FROM confessions WHERE name = 'Catholique';
  SELECT id INTO protestant_id FROM confessions WHERE name = 'Protestant';
  SELECT id INTO evangelique_id FROM confessions WHERE name = 'Évangélique';
  
  IF NOT EXISTS (SELECT 1 FROM groups LIMIT 1) THEN
    INSERT INTO groups (name, description, type, visibility, creator_id, confession_ids, member_count, is_active) VALUES
    ('Jeunes Chrétiens de Cotonou', 'Groupe pour les jeunes chrétiens de 18-35 ans de Cotonou. Partage, prière, activités et témoignages pour grandir ensemble dans la foi.', 'youth', 'public', marie_c_id, ARRAY[catholique_id, protestant_id, evangelique_id], 45, true),
    ('Familles Catholiques du Bénin', 'Espace d''échange et de soutien pour les familles catholiques. Partage d''expériences, conseils éducatifs et prières communes.', 'family', 'private', karamatou_id, ARRAY[catholique_id], 32, true),
    ('Prière pour le Bénin', 'Groupe de prière intercessionnel pour notre nation béninoise. Prions ensemble pour la paix, la prospérité et le réveil spirituel.', 'prayer', 'public', martory_id, ARRAY[]::uuid[], 78, true),
    ('Entrepreneurs Chrétiens', 'Réseau d''entrepreneurs et professionnels chrétiens. Partage d''opportunités, conseils business et prières pour nos activités.', 'professional', 'private', saens_id, ARRAY[]::uuid[], 25, true);
  END IF;
  
  RAISE NOTICE '✅ Groupes insérés avec succès !';
END $$;

-- =====================================================
-- 12. ACTIVITÉS
-- =====================================================

DO $$ 
DECLARE
  modeste_id uuid;
  catherine_id uuid;
  marie_c_id uuid;
  karamatou_id uuid;
  cathedrale_id uuid;
  evangelique_id uuid;
BEGIN
  SELECT id INTO modeste_id FROM profiles WHERE email = 'modestegando@gmail.com';
  SELECT id INTO catherine_id FROM profiles WHERE email = 'catherinelawani@gmail.com';
  SELECT id INTO marie_c_id FROM profiles WHERE email = 'marieconsolation@gmail.com';
  SELECT id INTO karamatou_id FROM profiles WHERE email = 'karamatou@gmail.com';
  SELECT id INTO cathedrale_id FROM parishes WHERE name = 'Cathédrale Notre-Dame de Miséricorde';
  SELECT id INTO evangelique_id FROM parishes WHERE name = 'Église Évangélique du Bénin';
  
  IF NOT EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
    INSERT INTO activities (title, description, activity_type, parish_id, date_start, location, max_participants, status, organizer_id, image_url, is_active) VALUES
    ('Messe dominicale - Cathédrale', 'Messe dominicale solennelle avec chorale et prédication. Venez nombreux pour célébrer ensemble la résurrection du Christ.', 'mass', cathedrale_id, NOW() + INTERVAL '2 days 9 hours', 'Cathédrale Notre-Dame de Miséricorde', 500, 'upcoming', modeste_id, 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Soirée de prière et louange', 'Temps de prière communautaire, louanges et intercession pour notre nation et nos familles. Apportez vos instruments de musique !', 'prayer_meeting', evangelique_id, NOW() + INTERVAL '1 day 19 hours', 'Salle principale - Église Évangélique', 150, 'upcoming', catherine_id, 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Étude biblique - Livre des Actes', 'Étude approfondie du livre des Actes des Apôtres. Découvrons ensemble les premiers pas de l''Église primitive et leurs leçons pour aujourd''hui.', 'bible_study', cathedrale_id, NOW() + INTERVAL '12 hours', 'Salle paroissiale', 40, 'upcoming', marie_c_id, 'https://images.pexels.com/photos/1624504/pexels-photo-1624504.jpeg?auto=compress&cs=tinysrgb&w=400', true),
    ('Collecte de vivres pour les démunis', 'Action caritative pour collecter des vivres et vêtements pour les familles démunies de notre quartier. Votre générosité fait la différence !', 'charity_event', cathedrale_id, NOW() + INTERVAL '3 days', 'Parvis de la cathédrale', NULL, 'upcoming', karamatou_id, 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400', true);
  END IF;
  
  RAISE NOTICE '✅ Activités insérées avec succès !';
END $$;

-- =====================================================
-- 13. CÉLÉBRATIONS
-- =====================================================

DO $$ 
DECLARE
  catholique_id uuid;
BEGIN
  SELECT id INTO catholique_id FROM confessions WHERE name = 'Catholique';
  
  IF NOT EXISTS (SELECT 1 FROM celebrations LIMIT 1) THEN
    INSERT INTO celebrations (name, description, date, celebration_type, confession_id, is_public) VALUES
    ('Culte de Louange et Guérison', 'Service spécial de louange avec prières de guérison pour notre communauté', NOW() + INTERVAL '7 days', 'special_service', NULL, true),
    ('Anniversaire Église Béthel - 25 ans', 'Célébration spéciale pour les 25 ans de l''Église Béthel avec témoignages', NOW() + INTERVAL '14 days', 'anniversary', catholique_id, true);
  END IF;
  
  RAISE NOTICE '✅ Célébrations insérées avec succès !';
END $$;

-- =====================================================
-- 14. PARCOURS BIBLIQUES
-- =====================================================

DO $$ 
DECLARE
  modeste_id uuid;
BEGIN
  SELECT id INTO modeste_id FROM profiles WHERE email = 'modestegando@gmail.com';
  
  IF NOT EXISTS (SELECT 1 FROM biblical_paths LIMIT 1) THEN
    INSERT INTO biblical_paths (title, description, author_id, duration, difficulty, is_public) VALUES
    ('Soulagement dans l''épreuve', 'Parcours personnalisé pour trouver la paix et l''espoir dans les moments difficiles', modeste_id, 7, 'beginner', true),
    ('Harmonie familiale chrétienne', 'Parcours pour renforcer les liens familiaux selon les principes bibliques', modeste_id, 14, 'intermediate', true);
  END IF;
  
  RAISE NOTICE '✅ Parcours bibliques insérés avec succès !';
END $$;

-- =====================================================
-- 15. MUR DE PRIÈRE
-- =====================================================

DO $$ 
DECLARE
  rodiath_id uuid;
BEGIN
  SELECT id INTO rodiath_id FROM profiles WHERE email = 'rodiath@gmail.com';
  
  IF NOT EXISTS (SELECT 1 FROM prayer_wall LIMIT 1) THEN
    INSERT INTO prayer_wall (author_id, title, content, intention, is_anonymous, is_public, prayer_count) VALUES
    (rodiath_id, 'Guérison pour ma mère', 'Ma mère souffre d''une maladie grave. Priez pour sa guérison complète.', 'healing', false, true, 234),
    (NULL, 'Réconciliation familiale', 'Prière pour la réconciliation dans ma famille après des années de conflit.', 'family', true, true, 89);
  END IF;
  
  RAISE NOTICE '✅ Mur de prière inséré avec succès !';
END $$;

-- =====================================================
-- 16. DÉFIS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenges LIMIT 1) THEN
    INSERT INTO challenges (title, description, type, start_date, end_date, is_active, participants_count, image_url) VALUES
    ('50 000 prières pour les orphelins de Dassa', 'Unissons-nous dans la prière pour les enfants orphelins de Dassa-Zoumé', 'prayer_count', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true, 4, 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=400'),
    ('100 000 Amen pour la paix au Bénin', 'Disons ensemble 100 000 Amen pour la paix et l''unité dans notre nation', 'prayer_count', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true, 5, 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=400');
  END IF;
  
  RAISE NOTICE '✅ Défis insérés avec succès !';
END $$;

-- =====================================================
-- 17. MÉDITATIONS PAR LIEU
-- =====================================================

DO $$ 
DECLARE
  portonovo_id uuid;
  cotonou_id uuid;
  modeste_id uuid;
BEGIN
  SELECT id INTO portonovo_id FROM cities WHERE name = 'Porto-Novo';
  SELECT id INTO cotonou_id FROM cities WHERE name = 'Cotonou';
  SELECT id INTO modeste_id FROM profiles WHERE email = 'modestegando@gmail.com';
  
  IF NOT EXISTS (SELECT 1 FROM location_meditations LIMIT 1) THEN
    INSERT INTO location_meditations (location_name, city_id, description, meditation_text, author_id, coordinates) VALUES
    ('Église Sainte-Anne de Porto-Novo', portonovo_id, 'Méditation spéciale pour les visiteurs de l''Église Sainte-Anne', 'Ne crains rien, car je suis avec toi; Ne promène pas des regards inquiets, car je suis ton Dieu', modeste_id, '6.4969,2.6283'),
    ('Calvaire de Cotonou', cotonou_id, 'Méditation contemplative près de la croix du Calvaire', 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos', modeste_id, '6.3703,2.3912');
  END IF;
  
  RAISE NOTICE '✅ Méditations par lieu insérées avec succès !';
END $$;

-- =====================================================
-- FIN - MESSAGE DE CONFIRMATION
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Insertion des données terminée avec succès !';
  RAISE NOTICE '📊 Résumé :';
  RAISE NOTICE '   - Continents: %', (SELECT COUNT(*) FROM continents);
  RAISE NOTICE '   - Pays: %', (SELECT COUNT(*) FROM countries);
  RAISE NOTICE '   - Villes: %', (SELECT COUNT(*) FROM cities);
  RAISE NOTICE '   - Confessions: %', (SELECT COUNT(*) FROM confessions);
  RAISE NOTICE '   - Paroisses: %', (SELECT COUNT(*) FROM parishes);
  RAISE NOTICE '   - Profils utilisateurs: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE '   - Articles marché: %', (SELECT COUNT(*) FROM market_items);
  RAISE NOTICE '   - Services: %', (SELECT COUNT(*) FROM services);
  RAISE NOTICE '   - Formations: %', (SELECT COUNT(*) FROM formations);
  RAISE NOTICE '   - Groupes: %', (SELECT COUNT(*) FROM groups);
  RAISE NOTICE '   - Activités: %', (SELECT COUNT(*) FROM activities);
  RAISE NOTICE '   - Célébrations: %', (SELECT COUNT(*) FROM celebrations);
  RAISE NOTICE '   - Parcours bibliques: %', (SELECT COUNT(*) FROM biblical_paths);
  RAISE NOTICE '   - Prières: %', (SELECT COUNT(*) FROM prayer_wall);
  RAISE NOTICE '   - Défis: %', (SELECT COUNT(*) FROM challenges);
  RAISE NOTICE '   - Méditations: %', (SELECT COUNT(*) FROM location_meditations);
END $$;