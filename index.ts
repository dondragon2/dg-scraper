import * as cheerio from 'cheerio';
import { createObjectCsvWriter } from 'csv-writer';


const fetchToken = async (url: string): Promise<{ cookies: string | null; token: string }> => {
    try {
        const response = await fetch(url);
        const body = await response.text();

        const $ = cheerio.load(body);

        const token = $('input[name="__RequestVerificationToken"]').val() as string;
        const cookies = response.headers.get('set-cookie');

        const filtered = (cookies ?? '').split(',').filter(c =>
            c.includes('BNI_persistence') ||
            c.includes('ENGELExt.Session') ||
            c.includes('X-XSRF-TOKEN-COOKIE') ||
            c.includes('BNES_ENGELExt.Session'))
            .map(c => c.split(';')[0].trim());

        return {token, cookies: filtered.join(';')};

    } catch (error) {
        console.error('Error fetching and parsing:', error);
        throw error;
    }
};

const fetchTotalPages = async (url: string, formData: any, cookies: string | null): Promise<number> => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: new URLSearchParams(formData),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies ?? '',
            }
        });

        const body = await response.text();
        const $ = cheerio.load(body);

        const lastPageLink = $('.PagedList-skipToLast a').attr('href');
        return lastPageLink ? parseInt(lastPageLink.split('page=')[1], 10) : 1;

    } catch (error) {
        console.error('Error fetching total pages:', error);
        throw error;
    }
};

const fetchAndParse = async (url: string, formData: any, cookies: string | null, page: number): Promise<void> => {
    try {
        console.log('fetching data', `${url}?page=${page}`);

        const response = await fetch(`${url}?page=${page}`, {
            method: page <= 1 ? 'POST' : 'GET',
            body: page <= 1 ? new URLSearchParams(formData) : undefined,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
                'pragma': 'no-cache',
                'Cookie': cookies ?? '',
                'Referer': `${url}?page=${page}`
            }
        });

        const body = await response.text();
        const $ = cheerio.load(body);

        const rows = $('#tableGels tbody tr');
        const data: any[] = [];

        rows.each((index, row) => {
            const columns = $(row).find('td');
            const rowData: any = {};

            rowData.id = $(columns[0]).text().trim();
            rowData.regime = $(columns[1]).text().trim();
            rowData.typeDeNature = $(columns[2]).text().trim();
            rowData.nom = $(columns[3]).text().trim();
            rowData.prenom = $(columns[4]).text().trim();
            rowData.alias = $(columns[5]).text().trim();
            rowData.dateDeNaissance = $(columns[6]).text().trim();
            rowData.lieuDeNaissance = $(columns[7]).text().trim();
            rowData.nationalite = $(columns[8]).text().trim();
            rowData.titre = $(columns[9]).text().trim();
            rowData.adresse = $(columns[10]).text().trim();
            rowData.passeport = $(columns[11]).text().trim();
            rowData.identification = $(columns[12]).text().trim();
            rowData.fondementJuridique = $(columns[13]).text().trim();
            rowData.motifs = $(columns[14]).text().trim();

            data.push(rowData);
        });


        const filePath = `output/page_${page}.csv`;
        await saveToCSV(data, filePath);
        console.log(`Data saved to ${filePath}`);
    } catch (e) {
        console.error('Error fetching and parsing:', e);
        throw e;
    }
};

const saveToCSV = async (data: any[], filePath: string) => {
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        encoding: 'utf8',
        header: [
            {id: 'id', title: 'Id'},
            {id: 'regime', title: 'Régime'},
            {id: 'typeDeNature', title: 'Type de nature'},
            {id: 'nom', title: 'Nom'},
            {id: 'prenom', title: 'Prénom'},
            {id: 'alias', title: 'Alias'},
            {id: 'dateDeNaissance', title: 'Date de naissance'},
            {id: 'lieuDeNaissance', title: 'Lieu de naissance'},
            {id: 'nationalite', title: 'Nationalité'},
            {id: 'titre', title: 'Titre'},
            {id: 'adresse', title: 'Adresse'},
            {id: 'passeport', title: 'Passeport'},
            {id: 'identification', title: 'Identification'},
            {id: 'fondementJuridique', title: 'Fondement juridique'},
            {id: 'motifs', title: 'Motifs'}
        ]
    });

    await csvWriter.writeRecords(data);
};

(async () => {
    const url = 'https://gels-avoirs.dgtresor.gouv.fr/List';
    const tokenData = await fetchToken(url);

    if (tokenData) {

        const formData = {
            QueryNomPrenomAlias: '',
            QueryDateNaissance: '',
            QueryTypeNature: '',
            __RequestVerificationToken: tokenData.token
        };

        const totalPages = await fetchTotalPages(url, formData, tokenData.cookies);
        console.log('Total Pages:', totalPages);

        await fetchAndParse(url, formData, tokenData.cookies, 1);
        const results = [];

        for (let page = 2; page <= totalPages; page++) {
            results.push(fetchAndParse(url, formData, tokenData.cookies, page));
        }

        await Promise.all(results);
    }
})();