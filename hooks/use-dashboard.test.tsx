import { renderHook, act } from '@testing-library/react';
import { useDashboard, useCampaigns, useDonations } from './use-dashboard';

// Mock fetch globally
global.fetch = jest.fn();

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDashboard());
    
    expect(result.current.stats).toBeNull();
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.donations).toEqual([]);
    expect(result.current.chaining).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  describe('fetchDashboardData', () => {
    it('should fetch all dashboard data successfully', async () => {
      const mockStats = {
        totalCampaigns: 10,
        activeCampaigns: 5,
        totalDonations: 15000,
        totalDonors: 100,
        totalChained: 25,
        totalEarnings: 5000,
        recentDonations: [
          {
            id: '1',
            amount: 100,
            currency: 'USD',
            message: 'Great cause!',
            donorName: 'John Doe',
            campaignTitle: 'Test Campaign',
            createdAt: '2023-01-01',
          },
        ],
      };

      const mockCampaigns = [
        {
          id: '1',
          title: 'Test Campaign',
          subtitle: 'Test Subtitle',
          goalAmount: 1000,
          currentAmount: 500,
          currency: 'USD',
          status: 'active',
          isActive: true,
          coverImageUrl: 'https://example.com/image',
          progressPercentage: 50,
          donationCount: 10,
          createdAt: '2023-01-01',
        },
      ];

      const mockDonations = [
        {
          id: '1',
          amount: 100,
          currency: 'USD',
          paymentStatus: 'completed',
          paymentMethod: 'card',
          message: 'Great cause!',
          isAnonymous: false,
          createdAt: '2023-01-01',
          processedAt: '2023-01-01',
          campaignId: '1',
          campaignTitle: 'Test Campaign',
          campaignCoverImage: 'https://example.com/image',
          isSuccessful: true,
        },
      ];

      const mockChaining = [
        {
          id: '1',
          campaignId: '1',
          referralCode: 'ABC123',
          totalEarnings: 500,
          totalDonations: 1000,
          createdAt: '2023-01-01',
          campaignTitle: 'Test Campaign',
          campaignCoverImage: 'https://example.com/image',
          campaignGoal: 1000,
          campaignCurrent: 500,
          campaignCurrency: 'USD',
          progressPercentage: 50,
        },
      ];

             // Mock all fetch calls
       (fetch as jest.Mock)
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             stats: mockStats,
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             campaigns: mockCampaigns,
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             donations: mockDonations,
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             chaining: mockChaining,
           }),
         });

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.campaigns).toEqual(mockCampaigns);
      expect(result.current.donations).toEqual(mockDonations);
      expect(result.current.chaining).toEqual(mockChaining);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

             expect(fetch).toHaveBeenCalledWith('/api/dashboard/stats');
       expect(fetch).toHaveBeenCalledWith('/api/dashboard/campaigns');
       expect(fetch).toHaveBeenCalledWith('/api/dashboard/donations');
       expect(fetch).toHaveBeenCalledWith('/api/dashboard/chaining');
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Failed to load stats',
        }),
      });

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load dashboard data');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        await result.current.refreshData();
      });

      expect(result.current.stats).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load dashboard data');
    });
  });

  describe('refreshData', () => {
    it('should refresh dashboard data', async () => {
      const mockStats = {
        totalCampaigns: 5,
        activeCampaigns: 3,
        totalDonations: 8000,
        totalDonors: 50,
        totalChained: 15,
        totalEarnings: 3000,
        recentDonations: [],
      };

             (fetch as jest.Mock).mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           stats: mockStats,
         }),
       });

      const { result } = renderHook(() => useDashboard());

      await act(async () => {
        result.current.refreshData();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetch).toHaveBeenCalledWith('/api/dashboard/stats');
    });
  });
});

describe('useCampaigns (from dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty campaigns, loading true, and no error', () => {
    const { result } = renderHook(() => useCampaigns());
    
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch campaigns successfully', async () => {
    const mockCampaigns = [
      {
        id: '1',
        title: 'Dashboard Campaign',
        subtitle: 'Dashboard Subtitle',
        goalAmount: 1000,
        currentAmount: 500,
        currency: 'USD',
        status: 'active',
        isActive: true,
        coverImageUrl: 'https://example.com/image',
        progressPercentage: 50,
        donationCount: 10,
        createdAt: '2023-01-01',
      },
    ];

         // Mock the initial useEffect call and the manual refresh call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           campaigns: [],
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           campaigns: mockCampaigns,
         }),
       });

         const { result } = renderHook(() => useCampaigns());

     await act(async () => {
       await result.current.refreshCampaigns();
     });

     expect(result.current.campaigns).toEqual(mockCampaigns);
     expect(result.current.loading).toBe(false);
     expect(result.current.error).toBeNull();
     expect(fetch).toHaveBeenCalledWith('/api/dashboard/campaigns');
  });

  it('should handle campaign fetch errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'Failed to load campaigns',
      }),
    });

         const { result } = renderHook(() => useCampaigns());

     await act(async () => {
       await result.current.refreshCampaigns();
     });

     expect(result.current.campaigns).toEqual([]);
     expect(result.current.loading).toBe(false);
     expect(result.current.error).toBe('Failed to load campaigns');
  });
});

describe('useDonations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty donations, loading true, and no error', () => {
    const { result } = renderHook(() => useDonations());
    
    expect(result.current.donations).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch donations with default parameters', async () => {
    const mockDonations = [
      {
        id: '1',
        amount: 100,
        currency: 'USD',
        paymentStatus: 'completed',
        paymentMethod: 'card',
        message: 'Great cause!',
        isAnonymous: false,
        createdAt: '2023-01-01',
        processedAt: '2023-01-01',
        campaignId: '1',
        campaignTitle: 'Test Campaign',
        campaignCoverImage: 'https://example.com/image',
        isSuccessful: true,
      },
    ];

                          // Mock the initial useEffect call and the manual refresh call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           donations: [],
           pagination: {
             page: 1,
             limit: 10,
             total: 0,
             totalPages: 0,
           },
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           donations: mockDonations,
           pagination: {
             page: 1,
             limit: 10,
             total: 1,
             totalPages: 1,
           },
         }),
       });

       const { result } = renderHook(() => useDonations());

       await act(async () => {
         await result.current.refreshDonations();
       });

       expect(result.current.donations).toEqual(mockDonations);
       expect(result.current.loading).toBe(false);
       expect(result.current.error).toBeNull();
       expect(fetch).toHaveBeenCalledWith('/api/dashboard/donations?status=all&page=1&limit=10');
  });

  it('should fetch donations with custom parameters', async () => {
    const mockDonations = [
      {
        id: '1',
        amount: 200,
        currency: 'USD',
        paymentStatus: 'pending',
        paymentMethod: 'bank',
        message: 'Supporting the cause',
        isAnonymous: true,
        createdAt: '2023-01-01',
        processedAt: '2023-01-01',
        campaignId: '1',
        campaignTitle: 'Test Campaign',
        campaignCoverImage: 'https://example.com/image',
        isSuccessful: false,
      },
    ];

         // Mock the initial useEffect call and the manual refresh call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           donations: [],
           pagination: {
             page: 2,
             limit: 10,
             total: 0,
             totalPages: 0,
           },
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           donations: mockDonations,
           pagination: {
             page: 2,
             limit: 10,
             total: 1,
             totalPages: 1,
           },
         }),
       });

    const { result } = renderHook(() => useDonations('pending', 2));

    await act(async () => {
      await result.current.refreshDonations();
    });

    expect(result.current.donations).toEqual(mockDonations);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
         expect(fetch).toHaveBeenCalledWith('/api/dashboard/donations?status=pending&page=2&limit=10');
  });

  it('should handle donation fetch errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: 'Failed to load donations',
      }),
    });

    const { result } = renderHook(() => useDonations());

    await act(async () => {
      await result.current.refreshDonations();
    });

    expect(result.current.donations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load donations');
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDonations());

    await act(async () => {
      await result.current.refreshDonations();
    });

    expect(result.current.donations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load donations');
  });
}); 