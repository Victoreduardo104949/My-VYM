// Utility functions for physical evaluation calculations

export const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const calculateIMC = (weight: number, height: number) => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const getIMCClassification = (imc: number) => {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade Grau I';
  if (imc < 40) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
};

// Guedes Protocol (3 Skinfolds)
// Men: Triceps, Suprailiac, Abdomen
// Women: Subscapular, Supralliac, Thigh
export const calculateGuedes = (skinfolds: any, gender: 'male' | 'female', age: number) => {
  const sum = Object.values(skinfolds).reduce((a: any, b: any) => a + (b || 0), 0) as number;
  let dc: number;
  
  if (gender === 'male') {
    dc = 1.17136 - 0.06706 * Math.log10(sum);
  } else {
    dc = 1.16650 - 0.07063 * Math.log10(sum);
  }
  
  const fatPercentage = ((4.95 / dc) - 4.50) * 100;
  return Math.max(0, fatPercentage);
};

// Jackson & Pollock 3 Skinfolds
export const calculateJP3 = (skinfolds: any, gender: 'male' | 'female', age: number) => {
  const sum = Object.values(skinfolds).reduce((a: any, b: any) => a + (b || 0), 0) as number;
  let dc: number;

  if (gender === 'male') {
    dc = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age);
  } else {
    dc = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age);
  }

  const fatPercentage = ((4.95 / dc) - 4.50) * 100;
  return Math.max(0, fatPercentage);
};

// Jackson & Pollock 7 Skinfolds
export const calculateJP7 = (skinfolds: any, gender: 'male' | 'female', age: number) => {
  const sum = Object.values(skinfolds).reduce((a: any, b: any) => a + (b || 0), 0) as number;
  let dc: number;

  if (gender === 'male') {
    dc = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
  } else {
    dc = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
  }

  const fatPercentage = ((4.95 / dc) - 4.50) * 100;
  return Math.max(0, fatPercentage);
};

export const getFatLevelClassification = (fatPercentage: number, gender: 'male' | 'female', age: number) => {
  // Simple reference table (simplified for brevity)
  if (gender === 'male') {
    if (age < 30) {
      if (fatPercentage < 10) return 'Excelente';
      if (fatPercentage < 15) return 'Bom';
      if (fatPercentage < 20) return 'Normal';
      return 'Elevado';
    } else {
      if (fatPercentage < 12) return 'Excelente';
      if (fatPercentage < 18) return 'Bom';
      if (fatPercentage < 22) return 'Normal';
      return 'Elevado';
    }
  } else {
    if (age < 30) {
      if (fatPercentage < 16) return 'Excelente';
      if (fatPercentage < 20) return 'Bom';
      if (fatPercentage < 25) return 'Normal';
      return 'Elevado';
    } else {
      if (fatPercentage < 18) return 'Excelente';
      if (fatPercentage < 22) return 'Bom';
      if (fatPercentage < 28) return 'Normal';
      return 'Elevado';
    }
  }
};
