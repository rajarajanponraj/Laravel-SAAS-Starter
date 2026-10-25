<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\ServiceLocation;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceLocation>
 */
class ServiceLocationFactory extends Factory
{
    protected $model = ServiceLocation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'customer_id' => Customer::factory(),
            'name' => fake()->words(2, true).' Location',
            'address_line1' => fake()->streetAddress(),
            'address_line2' => null,
            'city' => fake()->city(),
            'state' => fake()->stateAbbr(),
            'postal_code' => fake()->postcode(),
            'country' => 'US',
            'access_notes' => 'Gate code #'.fake()->numerify('####'),
        ];
    }
}
