-- Thermostat uses fractional degrees; Climatiseur retains its integer temp_cible.
-- Keep the legacy column and copy existing thermostat targets before JPA switches.
ALTER TABLE objet_connecte ADD COLUMN thermostat_temp_cible REAL;
UPDATE objet_connecte
SET thermostat_temp_cible = temp_cible::REAL
WHERE type_objet = 'THERMOSTAT' AND thermostat_temp_cible IS NULL;
