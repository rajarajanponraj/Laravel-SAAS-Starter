<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display a listing of the workspace customers.
     */
    public function index(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('viewAny', [Customer::class, $workspace]);

        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', 'active');

        $query = $workspace->customers()
            ->withCount(['serviceLocations', 'workOrders'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%")
                        ->orWhere('phone', 'LIKE', "%{$search}%")
                        ->orWhere('company_name', 'LIKE', "%{$search}%");
                });
            })
            ->when($status !== 'all', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->latest();

        $customers = $query->paginate(15)->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'canManage' => in_array($workspace->getUserRole($request->user()), ['owner', 'admin'], true),
        ]);
    }

    /**
     * Store a newly created customer in workspace.
     */
    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        Gate::authorize('create', [Customer::class, $workspace]);

        $customer = $workspace->customers()->create($request->validated());

        return redirect()->route('customers.show', $customer)
            ->with('success', "Customer {$customer->name} created successfully.");
    }

    /**
     * Display the specified customer.
     */
    public function show(Request $request, Customer $customer): Response
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($customer->workspace_id === $workspace->id, 404);
        Gate::authorize('view', $customer);

        $customer->load([
            'serviceLocations' => fn ($q) => $q->latest(),
            'workOrders' => fn ($q) => $q->with(['assignedWorker', 'serviceLocation'])->latest()->limit(10),
        ]);

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'serviceLocations' => $customer->serviceLocations,
            'recentWorkOrders' => $customer->workOrders,
            'canManage' => in_array($workspace->getUserRole($request->user()), ['owner', 'admin'], true),
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($customer->workspace_id === $workspace->id, 404);
        Gate::authorize('update', $customer);

        $customer->update($request->validated());

        return back()->with('success', 'Customer updated successfully.');
    }

    /**
     * Remove or archive the specified customer.
     */
    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        $workspace = $request->user()->currentWorkspace;
        abort_unless($customer->workspace_id === $workspace->id, 404);
        Gate::authorize('delete', $customer);

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }
}
