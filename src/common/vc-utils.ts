// src/common/utils/vc-utils.ts

export function createVC({
    credentialId,
    issuer,
    issuanceDate,
    expirationDate,
    subjectId,
    subjectType,
    attendanceName,
    attendanceDate,
    attendanceProvider,
    displayName,
    displayImage,
    credentialStatusId,
    verificationMethod,
    challenge,
    jws,
  }: {
    credentialId: string;
    issuer: string;
    issuanceDate: string;
    expirationDate: string;
    subjectId: string;
    subjectType: string;
    attendanceName: string;
    attendanceDate: string;
    attendanceProvider: string;
    displayName: string;
    displayImage: string;
    credentialStatusId: string;
    verificationMethod: string;
    challenge: string;
    jws: string;
  }): string {
    const vcObject = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.ezid.com/vc',
      ],
      id: credentialId,
      type: ['VerifiableCredential', 'CertificateCredential'],
      issuer,
      issuanceDate,
      expirationDate,
      credentialStatus: {
        id: credentialStatusId,
        type: ['CredentialStatusList2017'],
      },
      credentialSubject: {
        id: subjectId,
        type: [subjectType],
        attendance: {
          name: attendanceName,
          date: attendanceDate,
          provider: attendanceProvider,
        },
        displayName,
        displayImage,
      },
      proof: {
        type: ['Ed25519Signature2018'],
        proofPurpose: 'assertionMethod',
        created: issuanceDate,
        verificationMethod,
        challenge,
        jws,
      },
    };
  
    return JSON.stringify(vcObject);
  }
  
  export function parseVC(vcString: string) {
    const vc = JSON.parse(vcString);
  
    return {
      context: vc['@context'],
      credentialId: vc.id,
      type: vc.type,
      issuer: vc.issuer,
      issuanceDate: vc.issuanceDate,
      expirationDate: vc.expirationDate,
      credentialStatusId: vc.credentialStatus?.id,
      credentialStatusType: vc.credentialStatus?.type,
      subjectId: vc.credentialSubject?.id,
      subjectType: vc.credentialSubject?.type,
      attendanceName: vc.credentialSubject?.attendance?.name,
      attendanceDate: vc.credentialSubject?.attendance?.date,
      attendanceProvider: vc.credentialSubject?.attendance?.provider,
      displayName: vc.credentialSubject?.displayName,
      displayImage: vc.credentialSubject?.displayImage,
      proofType: vc.proof?.type,
      proofPurpose: vc.proof?.proofPurpose,
      proofCreated: vc.proof?.created,
      verificationMethod: vc.proof?.verificationMethod,
      challenge: vc.proof?.challenge,
      jws: vc.proof?.jws,
    };
  }
  