INSERT INTO public.pharmacies (name, address, city, latitude, longitude, phone, is_dtsj_partner) VALUES
('Ibn Sino Dorixonasi', 'Amir Temur shoh ko''chasi 108', 'Tashkent', 41.3640, 69.2870, '+998 71 235 0101', true),
('Sihat Plus', 'Yunusobod 4-mavze, 12-uy', 'Tashkent', 41.3555, 69.2930, '+998 71 236 2020', true),
('Navro''z Farm', 'Chilonzor 9-kvartal, 5-uy', 'Tashkent', 41.2760, 69.2040, '+998 71 276 3030', true),
('Mehr Dorixonasi', 'Muqimiy ko''chasi 44', 'Tashkent', 41.2900, 69.2180, '+998 71 278 4040', false),
('Ulug''bek Farm', 'Mirzo Ulug''bek ko''chasi 56', 'Tashkent', 41.3380, 69.3350, '+998 71 262 5050', true),
('Buyuk Ipak Dorixonasi', 'Buyuk Ipak Yo''li ko''chasi 21', 'Tashkent', 41.3260, 69.3450, '+998 71 268 6060', true),
('Sergeli Sog''lom Hayot', 'Sergeli 6-mavze, 3-uy', 'Tashkent', 41.2280, 69.2200, '+998 71 255 7070', true),
('Eski Shahar Dorixonasi', 'Farobiy ko''chasi 17', 'Tashkent', 41.3260, 69.2280, '+998 71 244 8080', true),
('Olmazor Med', 'Qorasaroy ko''chasi 33', 'Tashkent', 41.3510, 69.2200, '+998 71 246 9090', false),
('Afrosiyob Farm', 'Toshkent yo''li 27', 'Samarkand', 39.6670, 66.9900, '+998 66 233 1111', true),
('Registon Dorixonasi', 'Registon ko''chasi 18', 'Samarkand', 39.6545, 66.9700, '+998 66 235 2222', true),
('Naqshband Farm', 'Bahouddin Naqshband ko''chasi 9', 'Bukhara', 39.7750, 64.4250, '+998 65 223 3333', true),
('Bobur Dorixonasi', 'Bobur shoh ko''chasi 40', 'Andijan', 40.7830, 72.3440, '+998 74 225 4444', true),
('Namangan Gul Farm', 'Navoiy ko''chasi 61', 'Namangan', 40.9980, 71.6720, '+998 69 227 5555', true),
('Farg''ona Sihat', 'Al-Farg''oniy ko''chasi 14', 'Fergana', 40.3860, 71.7860, '+998 73 244 6666', true);

-- Stock for the new pharmacies. Glucophage, Concor and Ventolin stay out of stock everywhere for the shortage demo.
INSERT INTO public.pharmacy_stock (pharmacy_id, medicine_id, quantity)
SELECT p.id, m.id, v.q FROM (VALUES
  ('Ibn Sino Dorixonasi','Panadol',30), ('Ibn Sino Dorixonasi','Siofor',10), ('Ibn Sino Dorixonasi','Amlodipin-Nika',14), ('Ibn Sino Dorixonasi','Kardiomagnil',22),
  ('Sihat Plus','Panadol',18), ('Sihat Plus','Bisoprolol-Richter',9), ('Sihat Plus','Salamol Eko',7), ('Sihat Plus','Nurofen',15),
  ('Navro''z Farm','Diabeton MR',8), ('Navro''z Farm','Enap',12), ('Navro''z Farm','Atoris',6), ('Navro''z Farm','Panadol',20),
  ('Mehr Dorixonasi','Nurofen',25), ('Mehr Dorixonasi','Augmentin',10), ('Mehr Dorixonasi','Lipitor',4),
  ('Ulug''bek Farm','Siofor',11), ('Ulug''bek Farm','Lorista',7), ('Ulug''bek Farm','Pulmicort',3), ('Ulug''bek Farm','Kardiomagnil',16),
  ('Buyuk Ipak Dorixonasi','Amlodipin-Nika',20), ('Buyuk Ipak Dorixonasi','Norvasc',6), ('Buyuk Ipak Dorixonasi','Panadol',24),
  ('Sergeli Sog''lom Hayot','Panadol',16), ('Sergeli Sog''lom Hayot','Enap',9), ('Sergeli Sog''lom Hayot','Salamol Eko',5),
  ('Eski Shahar Dorixonasi','Bisoprolol-Richter',13), ('Eski Shahar Dorixonasi','Atrovent',4), ('Eski Shahar Dorixonasi','Plavix',5), ('Eski Shahar Dorixonasi','Siofor',8),
  ('Olmazor Med','Nurofen',20), ('Olmazor Med','Augmentin',8), ('Olmazor Med','Panadol',12),
  ('Afrosiyob Farm','Siofor',9), ('Afrosiyob Farm','Amlodipin-Nika',11), ('Afrosiyob Farm','Panadol',18),
  ('Registon Dorixonasi','Kardiomagnil',14), ('Registon Dorixonasi','Atoris',5), ('Registon Dorixonasi','Spiriva',2),
  ('Naqshband Farm','Panadol',22), ('Naqshband Farm','Diabeton MR',7), ('Naqshband Farm','Enap',10),
  ('Bobur Dorixonasi','Panadol',19), ('Bobur Dorixonasi','Siofor',12), ('Bobur Dorixonasi','Bisoprolol-Richter',8), ('Bobur Dorixonasi','Salamol Eko',6),
  ('Namangan Gul Farm','Amlodipin-Nika',15), ('Namangan Gul Farm','Kardiomagnil',18), ('Namangan Gul Farm','Lorista',5),
  ('Farg''ona Sihat','Panadol',21), ('Farg''ona Sihat','Siofor',7), ('Farg''ona Sihat','Pulmicort',3), ('Farg''ona Sihat','Enap',11)
) AS v(pn, bn, q)
JOIN public.pharmacies p ON p.name = v.pn
JOIN public.medicines m ON m.brand_name = v.bn;