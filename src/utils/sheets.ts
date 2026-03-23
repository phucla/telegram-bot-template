// ID của Google Sheet (lấy từ URL)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Hàm ghi dữ liệu vào Google Sheet
export async function appendToSheet(sheets: any,values: any[], range: string) {
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        resource: {
            values: [values]
        }
    });
}

// Hàm ghi dữ liệu vào Google Sheet
export async function updateToSheet(sheets: any,values: any[], range: string) {
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        resource: {
            values: [values]
        }
    });
}

// Hàm ghi dữ liệu vào Google Sheet
export async function getToSheet(sheets: any,range: string) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
    });
    return response
}