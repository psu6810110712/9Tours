import { describe, expect, it } from 'vitest'
import { buildVerificationDetails } from './paymentVerification'

describe('buildVerificationDetails', () => {
  it('uses normalized block when available', () => {
    const sections = buildVerificationDetails({
      message: 'verified',
      code: '200000',
      normalized: {
        parties: {
          sender: {
            name: 'นายสมชาย ใจดี',
            bank: 'กสิกรไทย',
            account: '123-4-56789-0',
          },
          receiver: {
            name: 'Nine Tours Co., Ltd.',
            bank: 'Bangkok Bank',
            account: '987-6-54321-0',
          },
        },
        transaction: {
          dateTime: '2026-03-19T09:00:00.000Z',
          amount: 5000,
          reference: 'TX-5000',
        },
      },
      data: {},
    })

    const partySection = sections.find((section) => section.title === 'ผู้โอนและผู้รับ')
    expect(partySection?.items).toEqual([
      { label: 'ชื่อผู้โอน', value: 'นายสมชาย ใจดี' },
      { label: 'ธนาคารผู้โอน', value: 'กสิกรไทย' },
      { label: 'บัญชีผู้โอน', value: '123-4-56789-0' },
      { label: 'ชื่อผู้รับ', value: 'Nine Tours Co., Ltd.' },
      { label: 'ธนาคารผู้รับ', value: 'Bangkok Bank' },
      { label: 'บัญชีผู้รับ', value: '987-6-54321-0' },
    ])
  })

  it('falls back to legacy nested payloads without rendering object object', () => {
    const sections = buildVerificationDetails({
      message: 'verified',
      code: '201000',
      data: {
        sender: {
          displayName: { th: 'ผู้โอนเก่า' },
          bank: { th: 'ไทยพาณิชย์' },
          account: { value: '111-222-3333' },
        },
        receiver: {
          name: { en: 'Receiver Legacy' },
          bankName: { en: 'Krungthai' },
          accountNumber: { value: '999-888-7777' },
        },
      },
    })

    const partyValues = sections
      .find((section) => section.title === 'ผู้โอนและผู้รับ')
      ?.items
      .map((item) => item.value) ?? []

    expect(partyValues).toContain('ผู้โอนเก่า')
    expect(partyValues).toContain('ไทยพาณิชย์')
    expect(partyValues).toContain('111-222-3333')
    expect(partyValues).toContain('Receiver Legacy')
    expect(partyValues).toContain('Krungthai')
    expect(partyValues).toContain('999-888-7777')
    expect(partyValues).not.toContain('[object Object]')
  })

  it('omits unrenderable values instead of showing object object', () => {
    const sections = buildVerificationDetails({
      data: {
        sender: {
          displayName: {},
        },
      },
    })

    const partySection = sections.find((section) => section.title === 'ผู้โอนและผู้รับ')
    expect(partySection).toBeUndefined()
  })
})
