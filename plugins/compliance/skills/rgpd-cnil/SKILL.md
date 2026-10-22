---
name: rgpd-cnil
description: >
  GDPR the French way (RGPD, CNIL) for an application: legal bases, retention, data subject rights,
  record of processing, DPIA, breaches, processors. Use when the user mentions RGPD, GDPR, CNIL,
  personal data, donnees personnelles, record of processing, registre des traitements, DPIA, AIPD, data
  subject rights, droits des personnes, data breach, DPO, or processing compliance.
---

# GDPR the French way (CNIL)

Framework: RGPD (GDPR, EU regulation 2016/679) and the loi Informatique et Libertes (French Data
Protection Act). The authority is the CNIL. This skill covers compliance engineering and the
documentation artifacts. It does not replace legal advice: say when a question is for the lawyer or the
DPO. Give the requirements and the article references, not fine statistics that would need checking.

Check the actual processing (the code, the flows, the database) rather than what the docs claim. Never
expose personal data in a log, a metric or a trace.

## Before any processing: the fundamentals

- **Legal basis** (Art. 6): each processing has exactly one, documented. Consent, contract, legal
  obligation, legitimate interest, public interest task, vital interests. For sensitive data (Art. 9:
  health, opinions, biometrics...), an additional condition lifting the prohibition.
- **Minimization** (Art. 5): collect only what is necessary for the purpose. No "just in case" field.
  Each data item is tied to an explicit purpose.
- **Purpose**: specified, explicit, legitimate. No incompatible reuse without a new basis.
- **Limited retention period**: one period per purpose, then deletion or anonymization. Distinguish the
  active database, intermediate archiving and deletion. No indefinite retention.
- **Security** (Art. 32): encryption in transit and at rest where relevant, access control, logging of
  access to sensitive data, pseudonymization. See the skill `securite-developpement` and the `security`
  pack.
- **Privacy by design and by default** (Art. 25): the default configuration is the most protective.

## Data subject rights (Art. 15 to 22)

Implement the flows for: access, rectification, erasure, restriction, objection, portability, and
automated decision-making (Art. 22). Deadlines to respect:

- Answer within **one month** of the request, **extendable by two months** if the request is complex or
  the requests are numerous (informing the person of the extension and the reason within the first
  month).
- Verify the requester's identity without collecting more than necessary.
- Free of charge in principle; a manifestly unfounded or excessive request can be refused (with
  reasons) or charged for.

## Record of processing activities (Art. 30)

Keep a record per processing with: purpose, legal basis, categories of data subjects and of data,
recipients, transfers outside the EU and safeguards, retention periods, security measures. Rely on the
CNIL's record template. The record describes what actually exists, not the intention.

## Impact assessment (DPIA / AIPD, Art. 35)

- Mandatory when the processing is likely to result in a high risk, in particular for the cases on the
  CNIL's list (profiling with significant effect, large-scale systematic monitoring, large-scale
  sensitive data, data matching, vulnerable people...).
- Method: description of the processing, assessment of necessity and proportionality, risk assessment
  (illegitimate access, modification, loss of data) and measures. Follow the CNIL's PIA method and its
  PIA software if useful.

## Data breach (Art. 33 and 34)

- Notify the CNIL **within 72 hours** of becoming aware of it, unless the breach is unlikely to result
  in a risk to individuals.
- Inform the data subjects without undue delay if the risk is high.
- Keep an internal record of breaches, whatever the outcome.

## Processors (Art. 28)

Any provider that processes data on behalf of the controller is bound by a contract (DPA) specifying
the subject matter, duration, instructions, confidentiality, security, what happens to the data at the
end of the contract, sub-processors and assistance with rights. See the vendored skill
`gdpr-compliance` for a clause template, to adapt to French law.

## Transfers outside the EU

Document every transfer outside the European Union and its safeguard (adequacy decision, standard
contractual clauses, binding corporate rules). Map the processors and their hosting regions.

## Related topics

- Cookies and trackers: see the skill `cookies-consentement-cnil`.
- Mentions legales, CGU, CGV: see the skill `mentions-legales-cgu-cgv`.
- Accessibility (RGAA, EAA): see the skills `rgaa` and `wcag`.
- For any figure about a recent sanction, check at the source (CNIL website) before writing it: do not
  repeat a figure from memory.
