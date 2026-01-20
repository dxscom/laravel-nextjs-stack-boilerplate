<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Omnify\SsoClient\Database\Seeders\Concerns\AssignsRoles;
use Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData;
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\User;

/**
 * Seeder for app-specific permissions and test user role assignments.
 * 
 * Extends the base SsoRolesSeeder with:
 * - App-specific permissions (app.*)
 * - Test user role assignments
 */
class PermissionSeeder extends Seeder
{
    use FetchesConsoleData, AssignsRoles;

    public function run(): void
    {
        // 1. Run base seeder for standard roles and service-admin permissions
        $this->call(SsoRolesSeeder::class);

        // 2. Create app-specific permissions
        $this->createAppPermissions();

        // 3. Assign app permissions to roles
        $this->assignAppPermissionsToRoles();

        // 4. Assign roles to test users
        $this->assignRolesToTestUsers();
    }

    /**
     * Create app-specific permissions.
     */
    protected function createAppPermissions(): void
    {
        $permissions = [
            // Dashboard
            ['slug' => 'app.dashboard.view', 'group' => 'app.dashboard'],
            ['slug' => 'app.dashboard.analytics', 'group' => 'app.dashboard'],
            
            // Users Management
            ['slug' => 'app.users.view', 'group' => 'app.users'],
            ['slug' => 'app.users.create', 'group' => 'app.users'],
            ['slug' => 'app.users.update', 'group' => 'app.users'],
            ['slug' => 'app.users.delete', 'group' => 'app.users'],
            ['slug' => 'app.users.export', 'group' => 'app.users'],
            
            // Roles & Permissions
            ['slug' => 'app.roles.view', 'group' => 'app.roles'],
            ['slug' => 'app.roles.create', 'group' => 'app.roles'],
            ['slug' => 'app.roles.update', 'group' => 'app.roles'],
            ['slug' => 'app.roles.delete', 'group' => 'app.roles'],
            ['slug' => 'app.permissions.manage', 'group' => 'app.roles'],
            
            // Branches
            ['slug' => 'app.branches.view', 'group' => 'app.branches'],
            ['slug' => 'app.branches.create', 'group' => 'app.branches'],
            ['slug' => 'app.branches.update', 'group' => 'app.branches'],
            ['slug' => 'app.branches.delete', 'group' => 'app.branches'],
            
            // Teams
            ['slug' => 'app.teams.view', 'group' => 'app.teams'],
            ['slug' => 'app.teams.create', 'group' => 'app.teams'],
            ['slug' => 'app.teams.update', 'group' => 'app.teams'],
            ['slug' => 'app.teams.delete', 'group' => 'app.teams'],
            ['slug' => 'app.teams.manage_members', 'group' => 'app.teams'],
            
            // Reports
            ['slug' => 'app.reports.view', 'group' => 'app.reports'],
            ['slug' => 'app.reports.create', 'group' => 'app.reports'],
            ['slug' => 'app.reports.export', 'group' => 'app.reports'],
            
            // Settings
            ['slug' => 'app.settings.view', 'group' => 'app.settings'],
            ['slug' => 'app.settings.update', 'group' => 'app.settings'],
            ['slug' => 'app.settings.system', 'group' => 'app.settings'],
            
            // Audit Logs
            ['slug' => 'app.audit.view', 'group' => 'app.audit'],
            ['slug' => 'app.audit.export', 'group' => 'app.audit'],
        ];

        $created = 0;
        foreach ($permissions as $permission) {
            $name = ucwords(str_replace(['.', '_'], ' ', $permission['slug']));
            
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                [
                    'name' => $name,
                    'group' => $permission['group'],
                ]
            );
            $created++;
        }

        $this->logInfo("Created/Updated {$created} app permissions");
    }

    /**
     * Assign app permissions to roles.
     */
    protected function assignAppPermissionsToRoles(): void
    {
        $admin = Role::where('slug', 'admin')->first();
        $manager = Role::where('slug', 'manager')->first();
        $supervisor = Role::where('slug', 'supervisor')->first();
        $member = Role::where('slug', 'member')->first();
        $viewer = Role::where('slug', 'viewer')->first();

        // Admin: All permissions (already done by SsoRolesSeeder, but sync app.* too)
        if ($admin) {
            $admin->permissions()->sync(Permission::pluck('id'));
        }

        // Manager: Most app permissions except system settings and delete
        if ($manager) {
            $managerPerms = Permission::where(function ($q) {
                $q->where('slug', 'like', 'app.%')
                    ->whereNotIn('slug', [
                        'app.settings.system',
                        'app.roles.delete',
                        'app.permissions.manage',
                        'app.audit.export',
                    ]);
            })->orWhere('slug', 'like', 'service-admin.%')
              ->orWhere('slug', 'like', 'dashboard.%')
              ->pluck('id');
            $manager->permissions()->sync($managerPerms);
        }

        // Supervisor: View and some management
        if ($supervisor) {
            $supervisorPerms = Permission::whereIn('slug', [
                'app.dashboard.view',
                'app.dashboard.analytics',
                'app.users.view',
                'app.users.update',
                'app.teams.view',
                'app.teams.update',
                'app.teams.manage_members',
                'app.branches.view',
                'app.reports.view',
                'app.reports.create',
                'app.audit.view',
                'dashboard.view',
                'dashboard.analytics',
            ])->pluck('id');
            $supervisor->permissions()->sync($supervisorPerms);
        }

        // Member: Basic view permissions
        if ($member) {
            $memberPerms = Permission::whereIn('slug', [
                'app.dashboard.view',
                'app.users.view',
                'app.teams.view',
                'app.branches.view',
                'app.reports.view',
                'dashboard.view',
            ])->pluck('id');
            $member->permissions()->sync($memberPerms);
        }

        // Viewer: Dashboard and reports only
        if ($viewer) {
            $viewerPerms = Permission::whereIn('slug', [
                'app.dashboard.view',
                'app.reports.view',
                'dashboard.view',
            ])->pluck('id');
            $viewer->permissions()->sync($viewerPerms);
        }

        $this->logInfo("Assigned app permissions to roles");
    }

    /**
     * Assign roles to test users.
     * Fetches org/branch IDs dynamically from SSO Console.
     */
    protected function assignRolesToTestUsers(): void
    {
        // Find admin user
        $admin = User::where('email', 'admin@tempofast.com')->first();
        
        if (!$admin) {
            $this->logWarning('User admin@tempofast.com not found - skipping role assignments');
            return;
        }

        $adminRole = Role::where('slug', 'admin')->first();

        if (!$adminRole) {
            $this->logWarning('Admin role not found - skipping role assignments');
            return;
        }

        // Fetch org data from Console
        $orgData = $this->fetchOrgDataFromConsole('company-abc');
        
        if (!$orgData) {
            // Fallback: assign global role
            $this->assignRoleToUser($admin, $adminRole, null, null);
            $this->logInfo("Assigned {$adminRole->name} to {$admin->email} (global)");
            return;
        }

        // Assign admin role org-wide
        $this->assignRoleToUser($admin, $adminRole, $orgData['org_id'], null);
        $this->logInfo("Assigned {$adminRole->name} to {$admin->email} (org-wide for {$orgData['org_name']})");
    }
}
