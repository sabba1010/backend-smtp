const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_TO'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.warn(`⚠️ Missing required environment variables: ${missingEnv.join(', ')}`);
}

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const smtpHost = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.EMAIL_SMTP_PORT || 587);
const smtpSecure = process.env.EMAIL_SMTP_SECURE === 'true' || false;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function makePlainText(data) {
  // Basic fallback if HTML isn't supported
  const rows = [];
  const add = (label, value) => {
    if (value !== undefined && value !== null && value !== '') {
      rows.push(`${label}: ${value}`);
    }
  };

  add('Position applied for', data.positionAppliedFor);
  add('Contract type', data.contractType);
  add('Willing other posts', data.willingOtherPosts);

  add('Title', data.title);
  add('Surname', data.surname);
  add('Forenames', data.forenames);
  add('Preferred name', data.preferredName);
  add('Date of birth', data.dateOfBirth);
  add('Home address', data.homeAddress);
  add('Telephone (mobile)', data.telephoneMobile);
  add('Telephone (home)', data.telephoneHome);
  add('Email address', data.emailAddress);
  add('Preferred contact', data.preferredContact);
  add('National insurance', data.nationalInsurance);

  add('Work restrictions', data.workRestrictions);
  add('Work restrictions details', data.workRestrictionsDetails);

  if (Array.isArray(data.referees)) {
    data.referees.forEach((referee, idx) => {
      rows.push(`\nReferee #${idx + 1}`);
      add('  Name', referee.name);
      add('  Relationship', referee.relationship);
      add('  Organisation', referee.organisation);
      add('  Job title', referee.jobTitle);
      add('  Address', referee.address);
      add('  Telephone', referee.telephone);
      add('  Email', referee.email);
    });
  }

  add('Contact referees before interview', data.contactRefereesBeforeInterview);
  add('Grant permission to contact referees', data.grantPermissionReferees);

  if (Array.isArray(data.employments)) {
    data.employments.forEach((employment, idx) => {
      rows.push(`\nEmployment #${idx + 1}`);
      add('  Employer name', employment.employerName);
      add('  Employer address', employment.employerAddress);
      add('  Start date', employment.startDate);
      add('  End date', employment.endDate);
      add('  Position held', employment.positionHeld);
      add('  Main duties', employment.mainDuties);
      add('  Reason for leaving', employment.reasonForLeaving);
      add('  Notice period', employment.noticePeriod);
      add('  Contact number', employment.contactNumber);
      add('  Contact email', employment.contactEmail);
    });
  }

  if (Array.isArray(data.gaps)) {
    data.gaps.forEach((gap, idx) => {
      rows.push(`\nGap #${idx + 1}`);
      add('  From', gap.dateFrom);
      add('  To', gap.dateTo);
      add('  Reason', gap.reason);
    });
  }

  if (Array.isArray(data.educations)) {
    data.educations.forEach((education, idx) => {
      rows.push(`\nEducation #${idx + 1}`);
      add('  From', education.dateFrom);
      add('  To', education.dateTo);
      add('  Qualifications', education.qualifications);
    });
  }

  if (Array.isArray(data.trainings)) {
    data.trainings.forEach((training, idx) => {
      rows.push(`\nTraining #${idx + 1}`);
      add('  Establishment', training.establishment);
      add('  Dates', training.dates);
      add('  Qualifications', training.qualifications);
    });
  }

  if (Array.isArray(data.memberships)) {
    data.memberships.forEach((membership, idx) => {
      rows.push(`\nProfessional membership #${idx + 1}`);
      add('  Organisation name', membership.organisationName);
      add('  Registration no', membership.registrationNo);
      add('  Registration date', membership.registrationDate);
    });
  }

  add('Statutory conditions', data.statutoryConditions);
  add('Statutory conditions details', data.statutoryConditionsDetails);
  add('Reason for applying', data.reasonForApplying);

  add('Driving license', data.drivingLicense);
  add('Driving convictions', data.drivingConvictions);
  add('Driving convictions details', data.drivingConvictionsDetails);
  add('Manual gearbox', data.manualGearbox);
  add('Willing to drive', data.willingToDrive);
  add('Know staff', data.knowStaff);
  add('Know staff details', data.knowStaffDetails);
  add('Know young person', data.knowYoungPerson);
  add('Know young person details', data.knowYoungPersonDetails);
  add('Disciplinary sanction', data.disciplinarySanction);
  add('Disciplinary sanction details', data.disciplinarySanctionDetails);
  add('Previous dismissal', data.previousDismissal);
  add('Previous dismissal details', data.previousDismissalDetails);

  add('Criminal record status', data.hasCriminalRecord);
  add('Criminal record details', data.criminalRecordDetails);
  add('DBS check status', data.hasDBSCheck);
  add('DBS details', data.dbsDetails);

  add('Declaration sign name', data.declarationSignName);
  add('Declaration print name', data.declarationPrintName);
  add('Declaration date', data.declarationDate);
  add('Understand sign name', data.understandSignName);
  add('Understand print name', data.understandPrintName);
  add('Understand date', data.understandDate);

  return rows.join('\n');
}

function makeHtml(data) {
  const escape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const row = (label, value) =>
    `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:8px 12px;font-weight:600;width:220px;background:#f9fafb;color:#111827;">${escape(label)}</td><td style="padding:8px 12px;color:#111827;">${escape(value)}</td></tr>`;

  const section = (title, rows) => {
    if (!rows || rows.length === 0) return '';
    const header = `<tr><td colspan="2" style="padding:14px 12px 8px;font-size:14px;font-weight:700;background:#1f2937;color:#f9fafb;border-top:2px solid #d1d5db;">${escape(title)}</td></tr>`;
    return `<tbody>${header}${rows.join('')}</tbody>`;
  };

  const parts = [];
  parts.push(
    section('Position', [
      row('Position applied for', data.positionAppliedFor),
      row('Contract type', data.contractType),
      row('Willing other posts', data.willingOtherPosts),
    ]),
  );

  parts.push(
    section('Personal details', [
      row('Title', data.title),
      row('Surname', data.surname),
      row('Forenames', data.forenames),
      row('Preferred name', data.preferredName),
      row('Date of birth', data.dateOfBirth),
      row('Home address', data.homeAddress),
      row('Telephone (mobile)', data.telephoneMobile),
      row('Telephone (home)', data.telephoneHome),
      row('Email address', data.emailAddress),
      row('Preferred contact', data.preferredContact),
      row('National insurance', data.nationalInsurance),
    ]),
  );

  parts.push(
    section('Work entitlement', [
      row('Work restrictions', data.workRestrictions),
      row('Work restrictions details', data.workRestrictionsDetails),
    ]),
  );

  if (Array.isArray(data.referees)) {
    data.referees.forEach((referee, idx) => {
      parts.push(
        section(`Referee ${idx + 1}`, [
          row('Name', referee.name),
          row('Relationship', referee.relationship),
          row('Organisation', referee.organisation),
          row('Job title', referee.jobTitle),
          row('Address', referee.address),
          row('Telephone', referee.telephone),
          row('Email', referee.email),
        ]),
      );
    });
  }

  parts.push(
    section('Referees permissions', [
      row('Contact referees before interview', data.contactRefereesBeforeInterview),
      row('Grant permission to contact referees', data.grantPermissionReferees),
    ]),
  );

  if (Array.isArray(data.employments)) {
    data.employments.forEach((employment, idx) => {
      parts.push(
        section(`Employment ${idx + 1}`, [
          row('Employer name', employment.employerName),
          row('Employer address', employment.employerAddress),
          row('Start date', employment.startDate),
          row('End date', employment.endDate),
          row('Position held', employment.positionHeld),
          row('Main duties', employment.mainDuties),
          row('Reason for leaving', employment.reasonForLeaving),
          row('Notice period', employment.noticePeriod),
          row('Contact number', employment.contactNumber),
          row('Contact email', employment.contactEmail),
        ]),
      );
    });
  }

  if (Array.isArray(data.gaps)) {
    data.gaps.forEach((gap, idx) => {
      parts.push(
        section(`Gap ${idx + 1}`, [
          row('From', gap.dateFrom),
          row('To', gap.dateTo),
          row('Reason', gap.reason),
        ]),
      );
    });
  }

  if (Array.isArray(data.educations)) {
    data.educations.forEach((education, idx) => {
      parts.push(
        section(`Education ${idx + 1}`, [
          row('From', education.dateFrom),
          row('To', education.dateTo),
          row('Qualifications', education.qualifications),
        ]),
      );
    });
  }

  if (Array.isArray(data.trainings)) {
    data.trainings.forEach((training, idx) => {
      parts.push(
        section(`Training ${idx + 1}`, [
          row('Establishment', training.establishment),
          row('Dates', training.dates),
          row('Qualifications', training.qualifications),
        ]),
      );
    });
  }

  if (Array.isArray(data.memberships)) {
    data.memberships.forEach((membership, idx) => {
      parts.push(
        section(`Professional membership ${idx + 1}`, [
          row('Organisation name', membership.organisationName),
          row('Registration no', membership.registrationNo),
          row('Registration date', membership.registrationDate),
        ]),
      );
    });
  }

  parts.push(
    section('Statutory conditions', [
      row('Statutory conditions', data.statutoryConditions),
      row('Statutory conditions details', data.statutoryConditionsDetails),
    ]),
  );

  parts.push(
    section('Reason for applying', [
      row('Reason for applying', data.reasonForApplying),
    ]),
  );

  parts.push(
    section('Additional info', [
      row('Driving license', data.drivingLicense),
      row('Driving convictions', data.drivingConvictions),
      row('Driving convictions details', data.drivingConvictionsDetails),
      row('Manual gearbox', data.manualGearbox),
      row('Willing to drive', data.willingToDrive),
      row('Know staff', data.knowStaff),
      row('Know staff details', data.knowStaffDetails),
      row('Know young person', data.knowYoungPerson),
      row('Know young person details', data.knowYoungPersonDetails),
      row('Disciplinary sanction', data.disciplinarySanction),
      row('Disciplinary sanction details', data.disciplinarySanctionDetails),
      row('Previous dismissal', data.previousDismissal),
      row('Previous dismissal details', data.previousDismissalDetails),
      row('Criminal record status', data.hasCriminalRecord),
      row('Criminal record details', data.criminalRecordDetails),
      row('DBS check status', data.hasDBSCheck),
      row('DBS details', data.dbsDetails),
    ]),
  );

  parts.push(
    section('Declaration', [
      row('Declaration sign name', data.declarationSignName),
      row('Declaration print name', data.declarationPrintName),
      row('Declaration date', data.declarationDate),
      row('Understand sign name', data.understandSignName),
      row('Understand print name', data.understandPrintName),
      row('Understand date', data.understandDate),
    ]),
  );

  return `<html><body style="margin:0;padding:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="background:#f3f4f6;padding:24px;">
      <div style="max-width:800px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,0.08);">
        <div style="background:#111827;color:#f9fafb;padding:18px 24px;">
          <h1 style="margin:0;font-size:20px;letter-spacing:0.5px;">New Application Submitted</h1>
          <p style="margin:6px 0 0;font-size:14px;color:rgba(249,250,251,0.8);">A new applicant has submitted the online form.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${parts.join('')}
        </table>
        <div style="padding:18px 24px;font-size:13px;color:#6b7280;background:#f9fafb;">
          <p style="margin:0;">This email was generated automatically from your Care Connection application form.</p>
        </div>
      </div>
    </div>
  </body></html>`;
}

function makeAttachments(data) {
  if (!data.cvFileData) return [];

  // cvFileData is expected to be a data URL like "data:application/pdf;base64,...."
  const match = data.cvFileData.match(/^data:(.+);base64,(.+)$/);
  if (!match) return [];

  const contentType = match[1];
  const base64 = match[2];

  return [
    {
      filename: data.cvFileName || 'cv',
      content: base64,
      encoding: 'base64',
      contentType,
    },
  ];
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/send-email', async (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).json({ success: false, error: 'Missing form data.' });
  }

  console.log('send-email payload:', {
    positionAppliedFor: data.positionAppliedFor,
    hasCriminalRecord: data.hasCriminalRecord,
    criminalRecordDetails: data.criminalRecordDetails,
    hasDBSCheck: data.hasDBSCheck,
    dbsDetails: data.dbsDetails,
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const to = process.env.EMAIL_TO;
  const subject = `New Application: ${data.positionAppliedFor || 'Unknown Position'}`;
  const html = makeHtml(data);
  const text = makePlainText(data);

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
    attachments: makeAttachments(data),
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email.' });
  }
});

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Email backend listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try setting a different port, e.g. PORT=3001 npm start`);
      process.exit(1);
    }

    console.error('Server error:', err);
    process.exit(1);
  });
}

module.exports = app;