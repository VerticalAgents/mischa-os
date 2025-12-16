
UPDATE clientes SET gestaoclick_cliente_id = CASE nome
  WHEN 'Argentum Investimentos' THEN '2'
  WHEN 'Armazém da Redenção' THEN '3'
  WHEN 'Armazém do Sabor' THEN '4'
  WHEN 'Mercado Bampi' THEN '5'
  WHEN 'Bendita Esquina' THEN '6'
  WHEN 'Bruno - Distribuidor' THEN '8'
  WHEN 'CASL' THEN '9'
  WHEN 'Cavanhas Barão' THEN '10'
  WHEN 'CECIV UFRGS' THEN '11'
  WHEN 'Amor por Cestas' THEN '12'
  WHEN 'Restaurante Chalet Suisse' THEN '13'
  WHEN 'Confraria do Café' THEN '14'
  WHEN 'AMPM (João Wallig)' THEN '15'
  WHEN 'DCE UFCSPA' THEN '17'
  WHEN 'Mercearia Demarchi' THEN '18'
  WHEN 'Armazém Divino Verde' THEN '19'
  WHEN 'Engenho do Pão' THEN '22'
  WHEN 'Eurostock Investimentos' THEN '23'
  WHEN 'EWF Luta Livre' THEN '25'
  WHEN 'Med Café - Fleming' THEN '26'
  WHEN 'Giulia - Distribuidora' THEN '27'
  WHEN 'La Mafia (João Wallig)' THEN '30'
  WHEN 'La Mafia (Petrópolis)' THEN '31'
  WHEN 'Lancheria do Parque' THEN '32'
  WHEN 'Madri Padaria e Confeitaria' THEN '33'
  WHEN 'Moita Lanches' THEN '34'
  WHEN 'REDEVIP24H (Aeroporto)' THEN '36'
  WHEN 'REDEVIP24H (Anita)' THEN '37'
  WHEN 'REDEVIP24H (Bela Vista)' THEN '38'
  WHEN 'REDEVIP24H (Bento/Intercap)' THEN '39'
  WHEN 'REDEVIP24H (Carlos Gomes)' THEN '40'
  WHEN 'REDEVIP24H (Forte/Via Porto)' THEN '41'
  WHEN 'REDEVIP24H (Moinhos)' THEN '42'
  WHEN 'REDEVIP24H (Ramiro)' THEN '43'
  WHEN 'Silva Lanches' THEN '44'
  WHEN 'Temperandus' THEN '46'
  WHEN 'Xiru Beer' THEN '47'
  WHEN 'Guadalajara Formaturas' THEN '49'
  WHEN 'REDEVIP24H (Planetário)' THEN '50'
  WHEN 'REDEVIP24H (Brino)' THEN '51'
  WHEN 'REDEVIP24H (Painera)' THEN '52'
  WHEN 'REDEVIP24H (Pasqualini)' THEN '53'
  WHEN 'Mercado Pinheiro' THEN '54'
  WHEN 'Curtir e Celebrar Cestas' THEN '55'
  WHEN 'Limas Bar' THEN '57'
  WHEN 'Panetteria' THEN '58'
  WHEN 'Refugios Bar e Restaurante' THEN '60'
  WHEN 'Boteco 787' THEN '64'
  WHEN 'Onii Soluções Autônomas' THEN '65'
  WHEN 'The Brothers Distribuidora' THEN '68'
  WHEN 'Mercado Santiago' THEN '70'
  WHEN 'Sirene Fish n Chips' THEN '74'
  WHEN 'DAEAMB - UFRGS' THEN '78'
  WHEN 'Padaria Castellani' THEN '83'
  WHEN 'Quadrado Express' THEN '84'
  WHEN 'Dom Caffelone' THEN '85'
  WHEN 'Sul Beer' THEN '86'
  WHEN 'RS CLUBE DE CAÇA E TIRO' THEN '87'
  WHEN 'Poeta Bar' THEN '88'
  WHEN 'Soberano Xis (Bela Vista)' THEN '89'
  WHEN 'Soberano Xis (Menino Deus)' THEN '90'
  WHEN 'Padaria Roma' THEN '91'
  WHEN 'Ka Churrasco' THEN '92'
  WHEN 'Griffe da Beleza' THEN '93'
  WHEN 'Casa de Carnes Cardoso' THEN '94'
  WHEN 'Roger Pasteis Filho' THEN '95'
  WHEN 'Smart Store' THEN '96'
  WHEN 'Tio do Gelo' THEN '97'
  WHEN 'Posto da Figueira 1' THEN '98'
  WHEN 'Povoada Gastrobar' THEN '99'
  WHEN 'Lancheria Diversidade' THEN '100'
  WHEN 'Cesar - Distribuidor' THEN '101'
  WHEN 'Mercado Adriana' THEN '102'
  WHEN 'Posto da Figueira 2' THEN '103'
  WHEN 'Gabriel Balbinot' THEN '104'
  WHEN 'Applause Café' THEN '105'
  WHEN 'Prato Mil (Ministério Público)' THEN '107'
  WHEN 'Armazém Rio Branco' THEN '108'
  WHEN 'Empório Dufort II (filial)' THEN '109'
  WHEN 'Empório Dufort Matriz' THEN '110'
  WHEN 'Soberano Xis (Sertório)' THEN '111'
  WHEN 'Posto Caminho Verde' THEN '114'
  WHEN 'E. Souza Lobo' THEN '118'
  WHEN 'Samara Pasteis' THEN '120'
  WHEN 'Mercado Teles' THEN '122'
  WHEN 'Paula Campos - Distribuidora' THEN '123'
  WHEN 'Casa de Carnes Bom Gosto' THEN '124'
  WHEN 'Julio - Distribuidor' THEN '125'
  WHEN 'Toda Hora Açaí' THEN '126'
  WHEN 'Vida Festa' THEN '127'
  WHEN 'Tatielle - Revendedora' THEN '128'
  WHEN 'Guilherme Jaeger' THEN '129'
  WHEN 'Severo Garage (Venâncio)' THEN '130'
  WHEN 'Lancheria Cebecos' THEN '131'
  WHEN 'Sabor Mágico' THEN '132'
  WHEN 'Armazem Protasio Alves' THEN '133'
  WHEN 'Soberano Xis (Protasio Delivery)' THEN '134'
  WHEN 'Crepe das Gurias' THEN '135'
  WHEN 'Kaylane - Revendedora' THEN '136'
  WHEN 'Paulo Jorge - Uber' THEN '137'
  WHEN 'Coral Tower Hotel (Petrópolis)' THEN '138'
  WHEN 'Carlos dos Santos - Revendedor' THEN '139'
  WHEN 'Yasmin - Uber' THEN '141'
  WHEN 'Multi Pães - Filial' THEN '142'
  WHEN 'Severo Garage (Boulevard Assis Brasil)' THEN '143'
  WHEN 'Severo Garage (PUCRS)' THEN '144'
  WHEN 'Severo Garage (Bourbon Assis Brasil)' THEN '145'
  WHEN 'Anderson - Uber' THEN '147'
  WHEN 'CEUE - UFRGS' THEN '148'
  WHEN 'REDEVIP24H (Alicar)' THEN '149'
  WHEN 'REDEVIP24H (Garagem Belem)' THEN '150'
  WHEN 'REDEVIP24H (Menino Deus)' THEN '151'
  WHEN 'Marcos - Uber' THEN '152'
  WHEN 'Line - Revendedora' THEN '153'
  WHEN 'Beneduzi' THEN '154'
  WHEN 'Edmilson - Uber' THEN '155'
  WHEN 'Coral Tower Hotel (Menino Deus)' THEN '156'
  WHEN '14 Bis Lanches' THEN '157'
  WHEN 'Café Delicias Gourmet' THEN '158'
  WHEN 'Padaria Vanellis' THEN '159'
  WHEN 'Smart Poa' THEN '161'
  WHEN 'Luzardo (Estrada do Mar)' THEN '162'
  WHEN 'Mercado Chaves' THEN '163'
  WHEN 'Supermercado Big Bom' THEN '164'
  WHEN 'The Best Coffee' THEN '166'
  WHEN 'Cesta Mimo' THEN '167'
  WHEN 'Pro Fit' THEN '168'
  ELSE gestaoclick_cliente_id
END
WHERE nome IN (
  'Argentum Investimentos', 'Armazém da Redenção', 'Armazém do Sabor', 'Mercado Bampi', 'Bendita Esquina',
  'Bruno - Distribuidor', 'CASL', 'Cavanhas Barão', 'CECIV UFRGS', 'Amor por Cestas',
  'Restaurante Chalet Suisse', 'Confraria do Café', 'AMPM (João Wallig)', 'DCE UFCSPA', 'Mercearia Demarchi',
  'Armazém Divino Verde', 'Engenho do Pão', 'Eurostock Investimentos', 'EWF Luta Livre', 'Med Café - Fleming',
  'Giulia - Distribuidora', 'La Mafia (João Wallig)', 'La Mafia (Petrópolis)', 'Lancheria do Parque',
  'Madri Padaria e Confeitaria', 'Moita Lanches', 'REDEVIP24H (Aeroporto)', 'REDEVIP24H (Anita)',
  'REDEVIP24H (Bela Vista)', 'REDEVIP24H (Bento/Intercap)', 'REDEVIP24H (Carlos Gomes)',
  'REDEVIP24H (Forte/Via Porto)', 'REDEVIP24H (Moinhos)', 'REDEVIP24H (Ramiro)', 'Silva Lanches',
  'Temperandus', 'Xiru Beer', 'Guadalajara Formaturas', 'REDEVIP24H (Planetário)', 'REDEVIP24H (Brino)',
  'REDEVIP24H (Painera)', 'REDEVIP24H (Pasqualini)', 'Mercado Pinheiro', 'Curtir e Celebrar Cestas',
  'Limas Bar', 'Panetteria', 'Refugios Bar e Restaurante', 'Boteco 787', 'Onii Soluções Autônomas',
  'The Brothers Distribuidora', 'Mercado Santiago', 'Sirene Fish n Chips', 'DAEAMB - UFRGS',
  'Padaria Castellani', 'Quadrado Express', 'Dom Caffelone', 'Sul Beer', 'RS CLUBE DE CAÇA E TIRO',
  'Poeta Bar', 'Soberano Xis (Bela Vista)', 'Soberano Xis (Menino Deus)', 'Padaria Roma', 'Ka Churrasco',
  'Griffe da Beleza', 'Casa de Carnes Cardoso', 'Roger Pasteis Filho', 'Smart Store', 'Tio do Gelo',
  'Posto da Figueira 1', 'Povoada Gastrobar', 'Lancheria Diversidade', 'Cesar - Distribuidor',
  'Mercado Adriana', 'Posto da Figueira 2', 'Gabriel Balbinot', 'Applause Café',
  'Prato Mil (Ministério Público)', 'Armazém Rio Branco', 'Empório Dufort II (filial)',
  'Empório Dufort Matriz', 'Soberano Xis (Sertório)', 'Posto Caminho Verde', 'E. Souza Lobo',
  'Samara Pasteis', 'Mercado Teles', 'Paula Campos - Distribuidora', 'Casa de Carnes Bom Gosto',
  'Julio - Distribuidor', 'Toda Hora Açaí', 'Vida Festa', 'Tatielle - Revendedora', 'Guilherme Jaeger',
  'Severo Garage (Venâncio)', 'Lancheria Cebecos', 'Sabor Mágico', 'Armazem Protasio Alves',
  'Soberano Xis (Protasio Delivery)', 'Crepe das Gurias', 'Kaylane - Revendedora', 'Paulo Jorge - Uber',
  'Coral Tower Hotel (Petrópolis)', 'Carlos dos Santos - Revendedor', 'Yasmin - Uber', 'Multi Pães - Filial',
  'Severo Garage (Boulevard Assis Brasil)', 'Severo Garage (PUCRS)', 'Severo Garage (Bourbon Assis Brasil)',
  'Anderson - Uber', 'CEUE - UFRGS', 'REDEVIP24H (Alicar)', 'REDEVIP24H (Garagem Belem)',
  'REDEVIP24H (Menino Deus)', 'Marcos - Uber', 'Line - Revendedora', 'Beneduzi', 'Edmilson - Uber',
  'Coral Tower Hotel (Menino Deus)', '14 Bis Lanches', 'Café Delicias Gourmet', 'Padaria Vanellis',
  'Smart Poa', 'Luzardo (Estrada do Mar)', 'Mercado Chaves', 'Supermercado Big Bom', 'The Best Coffee',
  'Cesta Mimo', 'Pro Fit'
);
