# Infrastructure & Directory Structure Assessment

## Executive Summary

**Issue**: CDK deployment fails when bundling Lambda functions that depend on workspace packages (`@twelve/core-types`). The bundling process cannot resolve monorepo workspace dependencies in isolated build contexts.

**Root Cause**: CDK's `NodejsFunction` bundling copies the Lambda directory to a temporary location and runs `npm install`, but workspace packages (symlinked in the monorepo root) are not available in that isolated context.

**Status**: ✅ **Structure is sound** - No restructuring needed. The issue is a bundling configuration problem, not a structural problem.

---

## Current Directory Structure

```
twelve-milk-mobs/
├── apps/                    # Frontend applications
│   ├── admin-web/          # Admin dashboard (Next.js)
│   ├── consumer-web/      # Consumer app (Next.js)
│   └── docs/               # Documentation site
│
├── packages/               # Shared packages (workspace dependencies)
│   ├── core-types/         # TypeScript types (used by Lambdas & apps)
│   ├── ui/                 # Shared UI components
│   ├── eslint-config/      # Shared ESLint configs
│   └── typescript-config/  # Shared TS configs
│
└── services/               # Backend services
    ├── infra/              # CDK infrastructure code
    │   ├── bin/
    │   │   └── infra.ts    # CDK app entry point
    │   └── lib/
    │       └── milk-mobs-stack.ts  # Stack definition
    │
    └── lambdas/            # Lambda function source code
        └── create-upload/
            ├── index.ts    # Lambda handler
            └── package.json # Lambda dependencies
```

### Structure Analysis

**✅ Strengths:**
- Clear separation of concerns (apps, packages, services)
- Follows standard monorepo patterns
- Workspace packages properly configured
- Infrastructure code separate from application code
- Lambda functions organized under `services/lambdas/`

**⚠️ Current Issue:**
- Lambda functions depend on workspace packages (`@twelve/core-types`)
- CDK bundling cannot resolve workspace dependencies in isolated build context
- This is a **bundling configuration issue**, not a structural problem

---

## Problem Details

### Error During Deployment

```
Error: ENOENT: no such file or directory, open 
'/path/to/cdk.out/asset.../node_modules/@twelve/core-types'
```

### Why This Happens

1. CDK's `NodejsFunction` uses esbuild to bundle Lambda code
2. During bundling, CDK:
   - Copies Lambda directory to temp location (`cdk.out/asset-.../`)
   - Runs `npm install` in that isolated directory
   - Attempts to bundle dependencies
3. **Problem**: `@twelve/core-types` is a workspace package:
   - It exists as a symlink in the monorepo root `node_modules/`
   - It's not a published npm package
   - It's not available in the isolated bundle directory
4. esbuild tries to resolve `@twelve/core-types` but can't find it

---

## Recommended Solutions

### ✅ **Solution 1: Fix Bundling Configuration (Recommended)**

**Approach**: Configure CDK bundling to handle workspace dependencies by copying the package into the bundle.

**Pros:**
- No structural changes needed
- Maintains current organization
- Works with existing monorepo setup
- Fast to implement

**Implementation**: Update `milk-mobs-stack.ts` to use `commandHooks` to copy the workspace package before bundling.

```typescript
bundling: {
  commandHooks: {
    beforeBundling(inputDir: string, outputDir: string): string[] {
      return [
        // Copy workspace package into bundle directory
        `cp -r ${path.join(__dirname, '../../../packages/core-types')} ${outputDir}/node_modules/@twelve/core-types`
      ];
    },
    // ... other hooks
  },
}
```

**Alternative**: Use `externalModules` to exclude `@twelve/core-types` and bundle it manually, or use a pre-build step.

---

### Option 2: Build core-types First

**Approach**: Compile `@twelve/core-types` to JavaScript before bundling Lambdas.

**Pros:**
- Cleaner separation
- Types compiled once, used everywhere
- Standard npm package structure

**Cons:**
- Requires build step before CDK deploy
- More complex build pipeline
- Types package needs build configuration

**Implementation**:
1. Add build script to `packages/core-types/package.json`
2. Build types before CDK synth/deploy
3. Reference built output in Lambda bundling

---

### Option 3: Restructure (Not Recommended)

**Approach**: Move Lambdas to be workspace packages themselves.

**Pros:**
- All workspace dependencies available
- Consistent with monorepo patterns

**Cons:**
- Major restructuring required
- Lambdas aren't really "packages" - they're deployable units
- Breaks separation of concerns (packages vs services)
- More complex than needed

**Verdict**: ❌ **Not recommended** - Current structure is correct.

---

## Recommended Action Plan

### Immediate Fix (Solution 1)

1. **Update CDK stack bundling configuration** to handle workspace dependencies
2. **Test deployment** to verify fix
3. **Document the pattern** for future Lambda functions

### Long-term Considerations

1. **Consider building core-types** if it grows in complexity
2. **Standardize Lambda bundling** across all functions
3. **Add CI/CD checks** to ensure workspace dependencies are handled

---

## Structure Assessment: Final Verdict

### ✅ **Structure is Sound - No Changes Needed**

The current directory structure follows best practices:
- ✅ Clear separation: apps, packages, services
- ✅ Proper workspace configuration
- ✅ Infrastructure code properly organized
- ✅ Lambda functions logically grouped

**The issue is bundling configuration, not structure.**

### Recommended Next Steps

1. **Implement Solution 1** (fix bundling config) - ~15 minutes
2. **Test deployment** - Verify fix works
3. **Document pattern** - For future Lambda functions
4. **Consider build pipeline** - If core-types grows complex

---

## Technical Details

### Current Workspace Configuration

```json
// package.json (root)
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ]
}
```

**Status**: ✅ Correctly configured

### Lambda Dependencies

```json
// services/lambdas/create-upload/package.json
{
  "dependencies": {
    "@twelve/core-types": "*"  // Workspace dependency
  }
}
```

**Status**: ✅ Correctly configured, but needs bundling fix

### CDK Stack Configuration

```typescript
// services/infra/lib/milk-mobs-stack.ts
new lambdaNodejs.NodejsFunction(this, 'CreateUploadFn', {
  entry: path.join(__dirname, '../../lambdas/create-upload/index.ts'),
  bundling: {
    nodeModules: ['@twelve/core-types'],  // ⚠️ Needs fix
  },
});
```

**Status**: ⚠️ Needs bundling configuration update

---

## Conclusion

**Recommendation**: Keep current structure, fix bundling configuration.

The directory structure is well-organized and follows industry best practices. The deployment failure is due to CDK's bundling process not handling workspace dependencies, which can be fixed with proper bundling configuration.

**Estimated Fix Time**: 15-30 minutes
**Risk Level**: Low (configuration change only)
**Impact**: High (enables successful deployments)

