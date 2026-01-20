<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Omnify\SsoClient\Models\Traits\HasConsoleSso;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable, HasConsoleSso;

    protected $fillable = [
        'name',
        'email',
        'console_user_id',
        'console_access_token',
        'console_refresh_token',
        'console_token_expires_at',
    ];

    protected $hidden = [
        'console_access_token',
        'console_refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'console_token_expires_at' => 'datetime',
        ];
    }
}
