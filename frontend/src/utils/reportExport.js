export const DASHBOARD_REPORT_EXCEL_MIME_TYPE =
  'application/vnd.ms-excel;charset=utf-8';

const REPORT_COLUMNS = [
  { key: 'confirmationNumber', label: 'Confirmation Number', type: 'String' },
  { key: 'guestName', label: 'Guest Name', type: 'String' },
  { key: 'roomNumber', label: 'Room Number', type: 'String' },
  { key: 'roomType', label: 'Room Type', type: 'String' },
  { key: 'checkInDate', label: 'Check-in Date', type: 'String' },
  { key: 'checkOutDate', label: 'Check-out Date', type: 'String' },
  { key: 'status', label: 'Status', type: 'String' },
  { key: 'totalPrice', label: 'Total Price (SAR)', type: 'Number', style: 'Money' },
  { key: 'totalPaid', label: 'Total Paid (SAR)', type: 'Number', style: 'Money' },
  { key: 'outstandingBalance', label: 'Outstanding Balance (SAR)', type: 'Number', style: 'Money' },
];

const escapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeSheetName = (value) =>
  escapeXml(String(value).replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31));

const numberOrBlank = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const cell = (value, type = 'String', styleId = null) => {
  if (value === null || value === undefined || value === '') {
    return `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}/>`;
  }

  if (type === 'Number') {
    const numeric = numberOrBlank(value);
    if (numeric === null) {
      return `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}/>`;
    }
    return `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="Number">${numeric}</Data></Cell>`;
  }

  return `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
};

const row = (cells, styleId = null) =>
  `<Row>${cells.map((item) => cell(item.value, item.type, item.styleId ?? styleId)).join('')}</Row>`;

const formatFilterValue = (value, fallback = 'All') =>
  value === null || value === undefined || value === '' ? fallback : value;

const buildSummarySheet = (report) => {
  const filters = report?.filters ?? {};
  const rows = [
    row([{ value: 'Roomify Reservation Report' }], 'Title'),
    row([{ value: 'Generated At' }, { value: report?.generatedAt ?? '-' }]),
    row([{ value: 'Date Range' }, { value: `${filters.startDate ?? '-'} to ${filters.endDate ?? '-'}` }]),
    row([{ value: 'Room Type Filter' }, { value: formatFilterValue(filters.roomTypeId) }]),
    row([{ value: 'Reservation Status' }, { value: formatFilterValue(filters.status) }]),
    row([{ value: 'Total Records' }, { value: report?.totalRecords ?? 0, type: 'Number' }]),
    row([{ value: 'Currency' }, { value: 'Saudi Riyal (SAR)' }]),
  ];

  return `
    <Worksheet ss:Name="${normalizeSheetName('Summary')}">
      <Table>
        <Column ss:Width="180"/>
        <Column ss:Width="240"/>
        ${rows.join('')}
      </Table>
    </Worksheet>`;
};

const buildReservationsSheet = (report) => {
  const dataRows = Array.isArray(report?.data) ? report.data : [];
  const widths = [160, 180, 110, 150, 120, 120, 130, 125, 125, 160];
  const header = row(REPORT_COLUMNS.map((column) => ({ value: column.label })), 'Header');
  const body = dataRows.map((item) =>
    row(
      REPORT_COLUMNS.map((column) => ({
        value: item?.[column.key],
        type: column.type,
        styleId: column.style,
      }))
    )
  );

  return `
    <Worksheet ss:Name="${normalizeSheetName('Reservations')}">
      <Table>
        ${widths.map((width) => `<Column ss:Width="${width}"/>`).join('')}
        ${header}
        ${body.join('')}
      </Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <FreezePanes/>
        <FrozenNoSplit/>
        <SplitHorizontal>1</SplitHorizontal>
        <TopRowBottomPane>1</TopRowBottomPane>
        <ActivePane>2</ActivePane>
      </WorksheetOptions>
    </Worksheet>`;
};

export const buildDashboardReportExcelXml = (report) => `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#111827"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#111827" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Money">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  ${buildSummarySheet(report)}
  ${buildReservationsSheet(report)}
</Workbook>`;

export const buildDashboardReportExcelBlob = (report) =>
  new Blob([buildDashboardReportExcelXml(report)], {
    type: DASHBOARD_REPORT_EXCEL_MIME_TYPE,
  });
