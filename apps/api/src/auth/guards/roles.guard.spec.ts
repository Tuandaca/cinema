import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow access if no roles are required (public route)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should deny access if user is missing/undefined on protected route", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should deny access if user has no role property", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
    const context = createMockContext({});

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should deny access if user role does not match required role (Role.USER != Role.ADMIN)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.USER });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should allow access if user role matches required role (Role.ADMIN)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.ADMIN });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should allow access if user matches one of multiple required roles", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([Role.ADMIN, Role.USER]);
    const context = createMockContext({ role: Role.USER });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
