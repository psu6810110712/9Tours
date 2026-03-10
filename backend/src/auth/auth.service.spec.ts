import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { AuthService } from './auth.service'
import { RefreshSession } from './entities/refresh-session.entity'
import { UsersService } from '../users/users.service'
import { AuthProvider, User, UserRole } from '../users/entities/user.entity'

type RefreshSessionRecord = RefreshSession & { user?: User }

describe('AuthService', () => {
  let authService: AuthService
  let usersService: jest.Mocked<UsersService>
  let jwtService: jest.Mocked<JwtService>
  let configService: jest.Mocked<ConfigService>
  let refreshSessionRepo: any
  let refreshSessions: RefreshSessionRecord[]
  let knownUsers: Record<string, User>

  const toPublicUser = (user: User) => ({
    id: user.id,
    prefix: user.prefix ?? null,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    profileCompleted: Boolean(user.prefix && user.name && user.email && user.phone),
  })

  const createUser = async (overrides?: Partial<User>): Promise<User> => ({
    id: randomUUID(),
    prefix: 'นาย',
    name: 'Test User',
    email: 'test@example.com',
    phone: '0812345678',
    password: await bcrypt.hash('password123', 10),
    role: UserRole.CUSTOMER,
    authProvider: AuthProvider.LOCAL,
    providerUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bookings: [],
    tourViews: [],
    refreshSessions: [],
    ...overrides,
  })

  beforeEach(() => {
    refreshSessions = []
    knownUsers = {}

    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByProviderUserId: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      toPublicUser: jest.fn((user: User) => toPublicUser(user)),
    } as unknown as jest.Mocked<UsersService>

    jwtService = {
      sign: jest.fn().mockImplementation(({ sub }) => `access-${sub}`),
    } as unknown as jest.Mocked<JwtService>

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'ACCESS_TOKEN_TTL':
            return '15m'
          case 'REFRESH_TOKEN_TTL_DAYS':
            return 7
          case 'REMEMBER_ME_REFRESH_TTL_DAYS':
            return 30
          default:
            return undefined
        }
      }),
    } as unknown as jest.Mocked<ConfigService>

    const saveSession = async (session: Partial<RefreshSessionRecord>) => {
      const persistedSession: RefreshSessionRecord = {
        id: session.id ?? randomUUID(),
        userId: session.userId!,
        tokenHash: session.tokenHash!,
        sessionFamily: session.sessionFamily!,
        userAgent: session.userAgent ?? null,
        ipAddress: session.ipAddress ?? null,
        isPersistent: session.isPersistent ?? false,
        expiresAt: session.expiresAt ?? new Date(),
        lastUsedAt: session.lastUsedAt ?? null,
        revokedAt: session.revokedAt ?? null,
        rotatedToSessionId: session.rotatedToSessionId ?? null,
        createdAt: session.createdAt ?? new Date(),
        user: session.user,
      }

      const existingIndex = refreshSessions.findIndex((item) => item.id === persistedSession.id)
      if (existingIndex >= 0) {
        refreshSessions[existingIndex] = persistedSession
      } else {
        refreshSessions.push(persistedSession)
      }

      return persistedSession
    }

    refreshSessionRepo = {
      create: jest.fn((data: Partial<RefreshSessionRecord>) => ({
        id: data.id ?? randomUUID(),
        createdAt: new Date(),
        revokedAt: null,
        rotatedToSessionId: null,
        lastUsedAt: null,
        ...data,
      })),
      save: jest.fn(saveSession),
      findOne: jest.fn(async ({ where }: { where: { tokenHash: string } }) => {
        const session = refreshSessions.find((item) => item.tokenHash === where.tokenHash)
        if (!session) {
          return null
        }
        return { ...session, user: session.user ?? knownUsers[session.userId] }
      }),
      createQueryBuilder: jest.fn(() => {
        let sessionFamily = ''
        let revokedAt = new Date()
        const builder = {
          update: jest.fn(() => builder),
          set: jest.fn((data) => {
            revokedAt = data.revokedAt
            return builder
          }),
          where: jest.fn((_: string, params: { sessionFamily: string }) => {
            sessionFamily = params.sessionFamily
            return builder
          }),
          andWhere: jest.fn(() => builder),
          execute: jest.fn(async () => {
            refreshSessions = refreshSessions.map((session) => (
              session.sessionFamily === sessionFamily && !session.revokedAt
                ? { ...session, revokedAt, lastUsedAt: revokedAt }
                : session
            ))
          }),
        }
        return builder
      }),
    }

    refreshSessionRepo.manager = {
      transaction: async (callback: (manager: { getRepository: () => typeof refreshSessionRepo }) => unknown) =>
        callback({ getRepository: () => refreshSessionRepo }),
    }

    authService = new AuthService(usersService, jwtService, configService, refreshSessionRepo)
  })

  it('registers public users as customers even if a role is supplied', async () => {
    const createdUser = await createUser()
    knownUsers[createdUser.id] = createdUser
    usersService.findByEmail.mockResolvedValue(null)
    usersService.create.mockResolvedValue(createdUser)

    const result = await authService.register({
      prefix: 'นาย',
      name: 'Public User',
      email: 'PUBLIC@EXAMPLE.COM',
      password: 'password123',
      phone: '0812345678',
      role: UserRole.ADMIN,
    } as any)

    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({
      prefix: 'นาย',
      email: 'PUBLIC@EXAMPLE.COM',
      role: UserRole.CUSTOMER,
      authProvider: AuthProvider.LOCAL,
      providerUserId: null,
    }), { hashPassword: true })
    expect(result.user.role).toBe(UserRole.CUSTOMER)
    expect(result.user.profileCompleted).toBe(true)
    expect(result.refresh_token).toEqual(expect.any(String))
  })

  it('rejects duplicate registration emails', async () => {
    const existingUser = await createUser()
    usersService.findByEmail.mockResolvedValue(existingUser)

    await expect(authService.register({
      prefix: 'นาย',
      name: 'Duplicate User',
      email: 'test@example.com',
      password: 'password123',
      phone: '0812345678',
    } as any)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('allows login with a phone number', async () => {
    const user = await createUser()
    knownUsers[user.id] = user
    usersService.findByPhone.mockResolvedValue(user)

    const result = await authService.login('0812345678', 'password123', true, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    })

    expect(usersService.findByPhone).toHaveBeenCalledWith('0812345678')
    expect(result.access_token).toBe(`access-${user.id}`)
    expect(result.rememberMe).toBe(true)
    expect(result.user.phone).toBe('0812345678')
  })

  it('rejects login when the password does not match', async () => {
    const user = await createUser()
    usersService.findByPhone.mockResolvedValue(user)

    await expect(authService.login('0812345678', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('creates a customer account for a new Google user', async () => {
    const createdUser = await createUser({
      prefix: null,
      email: 'google@example.com',
      password: null,
      phone: null,
      authProvider: AuthProvider.GOOGLE,
      providerUserId: 'google-user-1',
    })
    knownUsers[createdUser.id] = createdUser
    usersService.findByProviderUserId.mockResolvedValue(null)
    usersService.findByEmail.mockResolvedValue(null)
    usersService.create.mockResolvedValue(createdUser)

    const result = await authService.loginWithGoogle({
      email: 'google@example.com',
      name: 'Google User',
      providerUserId: 'google-user-1',
    })

    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({
      prefix: null,
      email: 'google@example.com',
      role: UserRole.CUSTOMER,
      authProvider: AuthProvider.GOOGLE,
      providerUserId: 'google-user-1',
      password: null,
      phone: null,
    }))
    expect(result.user.email).toBe('google@example.com')
    expect(result.user.profileCompleted).toBe(false)
  })

  it('auto-links Google to an existing customer with the same email', async () => {
    const existingUser = await createUser({
      email: 'customer@example.com',
      authProvider: AuthProvider.LOCAL,
      providerUserId: null,
    })
    knownUsers[existingUser.id] = existingUser
    usersService.findByProviderUserId.mockResolvedValue(null)
    usersService.findByEmail.mockResolvedValue(existingUser)
    usersService.save.mockImplementation(async (user) => {
      knownUsers[user.id] = user
      return user
    })

    const result = await authService.loginWithGoogle({
      email: 'customer@example.com',
      name: 'Customer User',
      providerUserId: 'google-user-2',
    })

    expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({
      id: existingUser.id,
      authProvider: AuthProvider.GOOGLE,
      providerUserId: 'google-user-2',
    }))
    expect(result.user.id).toBe(existingUser.id)
  })

  it('finds Google users by providerUserId before email when the email has changed', async () => {
    const existingGoogleUser = await createUser({
      email: 'old-google@example.com',
      authProvider: AuthProvider.GOOGLE,
      providerUserId: 'google-stable-id',
      password: null,
    })
    knownUsers[existingGoogleUser.id] = existingGoogleUser
    usersService.findByProviderUserId.mockResolvedValue(existingGoogleUser)

    const result = await authService.loginWithGoogle({
      email: 'new-google@example.com',
      name: 'Google User',
      providerUserId: 'google-stable-id',
    })

    expect(usersService.findByProviderUserId).toHaveBeenCalledWith('google-stable-id')
    expect(usersService.findByEmail).not.toHaveBeenCalled()
    expect(usersService.save).not.toHaveBeenCalled()
    expect(result.user.email).toBe('old-google@example.com')
  })

  it('blocks Google login for admin accounts with the same email', async () => {
    const adminUser = await createUser({
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    })
    usersService.findByProviderUserId.mockResolvedValue(null)
    usersService.findByEmail.mockResolvedValue(adminUser)

    await expect(authService.loginWithGoogle({
      email: 'admin@example.com',
      name: 'Admin User',
      providerUserId: 'google-admin',
    })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rotates refresh sessions and rejects reuse of old refresh tokens', async () => {
    const user = await createUser()
    knownUsers[user.id] = user
    usersService.findByEmail.mockResolvedValue(user)

    const loginResult = await authService.login('test@example.com', 'password123', true, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    })
    const initialRefreshToken = loginResult.refresh_token

    const refreshResult = await authService.refreshToken(initialRefreshToken, {
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    })

    expect(refreshResult.access_token).toBe(`access-${user.id}`)
    expect(refreshResult.refresh_token).not.toBe(initialRefreshToken)
    expect(refreshSessions).toHaveLength(2)
    expect(refreshSessions.find((session) => session.revokedAt === null)?.rotatedToSessionId ?? null).toBeNull()

    await expect(authService.refreshToken(initialRefreshToken)).rejects.toBeInstanceOf(UnauthorizedException)
    expect(refreshSessions.every((session) => session.revokedAt instanceof Date)).toBe(true)
  })

  it('revokes the current refresh session on logout', async () => {
    const user = await createUser()
    knownUsers[user.id] = user
    usersService.findByEmail.mockResolvedValue(user)

    const loginResult = await authService.login('test@example.com', 'password123', false)
    await authService.logout(loginResult.refresh_token)

    expect(refreshSessions).toHaveLength(1)
    expect(refreshSessions[0].revokedAt).toBeInstanceOf(Date)
  })
})
