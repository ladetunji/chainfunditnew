import { renderHook, act } from '@testing-library/react';
import { useCampaigns, useCampaign, useCampaignUpdates, useCampaignComments } from './use-campaigns';

// Mock fetch globally
global.fetch = jest.fn();

describe('useCampaigns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty campaigns, loading true, and no error', () => {
    const { result } = renderHook(() => useCampaigns());
    
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

     describe('fetchCampaigns', () => {
     it('should fetch campaigns successfully', async () => {
       const mockCampaigns = [
         {
           id: '1',
           title: 'Test Campaign',
           subtitle: 'Test Subtitle',
           description: 'Test Description',
           reason: 'Test Reason',
           fundraisingFor: 'Test Cause',
           duration: '30 days',
           videoUrl: 'https://example.com/video',
           coverImageUrl: 'https://example.com/image',
           galleryImages: [],
           documents: [],
           goalAmount: 1000,
           currency: 'USD',
           minimumDonation: 10,
           chainerCommissionRate: 5,
           currentAmount: 500,
           status: 'active',
           isActive: true,
           createdAt: '2023-01-01',
           updatedAt: '2023-01-01',
           closedAt: '2023-02-01',
           creatorId: 'user1',
           creatorName: 'John Doe',
           creatorAvatar: 'https://example.com/avatar',
         },
       ];

       // Mock the initial useEffect call and the manual fetch call
       (fetch as jest.Mock)
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             data: [],
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             data: mockCampaigns,
           }),
         });

       const { result } = renderHook(() => useCampaigns());

       await act(async () => {
         await result.current.fetchCampaigns();
       });

       expect(result.current.campaigns).toEqual(mockCampaigns);
       expect(result.current.loading).toBe(false);
       expect(result.current.error).toBeNull();
       expect(fetch).toHaveBeenCalledWith('/api/campaigns?');
     });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Failed to load campaigns',
        }),
      });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        await result.current.fetchCampaigns();
      });

      expect(result.current.campaigns).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load campaigns');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        await result.current.fetchCampaigns();
      });

      expect(result.current.campaigns).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load campaigns');
    });

    it('should apply filters correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: [],
        }),
      });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        await result.current.fetchCampaigns({
          status: 'active',
          reason: 'medical',
          creatorId: 'user1',
          limit: 10,
          offset: 0,
        });
      });

      expect(fetch).toHaveBeenCalledWith('/api/campaigns?status=active&reason=medical&creatorId=user1&limit=10');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      const mockFormData = {
        title: 'New Campaign',
        subtitle: 'New Subtitle',
        visibility: 'public' as const,
        reason: 'New Reason',
        fundraisingFor: 'New Cause',
        currency: 'USD',
        goal: 2000,
        duration: '60 days',
        video: 'https://example.com/video',
        documents: [] as File[],
        images: [] as File[],
        coverImage: null as File | null,
        story: 'New story',
      };

      const mockCreatedCampaign = {
        id: '2',
        ...mockFormData,
        goalAmount: mockFormData.goal,
        minimumDonation: 10,
        chainerCommissionRate: 5,
        currentAmount: 0,
        status: 'active',
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        closedAt: '2023-03-01',
        creatorId: 'user1',
        creatorName: 'John Doe',
        creatorAvatar: 'https://example.com/avatar',
        videoUrl: mockFormData.video,
        coverImageUrl: '',
        galleryImages: [],
        documents: [],
      };

             // Mock the initial useEffect call and the create campaign call
       (fetch as jest.Mock)
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             data: [],
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             data: mockCreatedCampaign,
           }),
         });

      const { result } = renderHook(() => useCampaigns());

             await act(async () => {
         const created = await result.current.createCampaign(mockFormData);
         expect(created).toEqual(mockCreatedCampaign);
       });

      expect(fetch).toHaveBeenCalledWith('/api/campaigns', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });

    it('should handle creation errors', async () => {
      const mockFormData = {
        title: 'New Campaign',
        subtitle: 'New Subtitle',
        visibility: 'public' as const,
        reason: 'New Reason',
        fundraisingFor: 'New Cause',
        currency: 'USD',
        goal: 2000,
        duration: '60 days',
        video: 'https://example.com/video',
        documents: [] as File[],
        images: [] as File[],
        coverImage: null as File | null,
        story: 'New story',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Failed to create campaign',
        }),
      });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        const created = await result.current.createCampaign(mockFormData);
        expect(created).toBeNull();
      });

      expect(result.current.error).toBe('Failed to create campaign');
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const mockUpdates = {
        title: 'Updated Campaign',
        description: 'Updated description',
      };

      const mockUpdatedCampaign = {
        id: '1',
        title: 'Updated Campaign',
        description: 'Updated description',
        // ... other fields
      };

             // Mock the initial useEffect call and the update campaign call
       (fetch as jest.Mock)
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             data: [],
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             data: mockUpdatedCampaign,
           }),
         });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        const updated = await result.current.updateCampaign('1', mockUpdates);
        expect(updated).toEqual(mockUpdatedCampaign);
      });

      expect(fetch).toHaveBeenCalledWith('/api/campaigns/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUpdates),
      });
    });

    it('should handle update errors', async () => {
      const mockUpdates = {
        title: 'Updated Campaign',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Failed to update campaign',
        }),
      });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        const updated = await result.current.updateCampaign('1', mockUpdates);
        expect(updated).toBeNull();
      });

      expect(result.current.error).toBe('Failed to update campaign');
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign successfully', async () => {
             // Mock the initial useEffect call and the delete campaign call
       (fetch as jest.Mock)
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
             data: [],
           }),
         })
         .mockResolvedValueOnce({
           ok: true,
           json: jest.fn().mockResolvedValue({
             success: true,
           }),
         });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        const deleted = await result.current.deleteCampaign('1');
        expect(deleted).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/campaigns/1', {
        method: 'DELETE',
      });
    });

    it('should handle deletion errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Failed to delete campaign',
        }),
      });

      const { result } = renderHook(() => useCampaigns());

      await act(async () => {
        const deleted = await result.current.deleteCampaign('1');
        expect(deleted).toBe(false);
      });

      expect(result.current.error).toBe('Failed to delete campaign');
    });
  });
});

describe('useCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null campaign, loading true, and no error', () => {
    const { result } = renderHook(() => useCampaign('1'));
    
    expect(result.current.campaign).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch single campaign successfully', async () => {
    const mockCampaign = {
      id: '1',
      title: 'Single Campaign',
      subtitle: 'Single Subtitle',
      description: 'Single Description',
      reason: 'Single Reason',
      fundraisingFor: 'Single Cause',
      duration: '30 days',
      videoUrl: 'https://example.com/video',
      coverImageUrl: 'https://example.com/image',
      galleryImages: [],
      documents: [],
      goalAmount: 1000,
      currency: 'USD',
      minimumDonation: 10,
      chainerCommissionRate: 5,
      currentAmount: 500,
      status: 'active',
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      closedAt: '2023-02-01',
      creatorId: 'user1',
      creatorName: 'John Doe',
      creatorAvatar: 'https://example.com/avatar',
    };

         // Mock the initial useEffect call and the manual fetch call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: null,
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: mockCampaign,
         }),
       });

    const { result } = renderHook(() => useCampaign('1'));

    await act(async () => {
      await result.current.fetchCampaign();
    });

    expect(result.current.campaign).toEqual(mockCampaign);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/campaigns/1');
  });
});

describe('useCampaignUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty updates, loading true, and no error', () => {
    const { result } = renderHook(() => useCampaignUpdates('1'));
    
    expect(result.current.updates).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch campaign updates successfully', async () => {
    const mockUpdates = [
      {
        id: '1',
        campaignId: '1',
        title: 'Update 1',
        content: 'Content 1',
        mediaUrl: 'https://example.com/media1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        creatorName: 'John Doe',
        creatorAvatar: 'https://example.com/avatar',
      },
    ];

         // Mock the initial useEffect call and the manual fetch call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: [],
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: mockUpdates,
         }),
       });

    const { result } = renderHook(() => useCampaignUpdates('1'));

    await act(async () => {
      await result.current.fetchUpdates();
    });

    expect(result.current.updates).toEqual(mockUpdates);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/campaigns/1/updates');
  });

  it('should create campaign update successfully', async () => {
    const mockUpdateData = {
      title: 'New Update',
      content: 'New content',
      mediaUrl: 'https://example.com/new-media',
    };

    const mockCreatedUpdate = {
      id: '2',
      campaignId: '1',
      ...mockUpdateData,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      creatorName: 'John Doe',
      creatorAvatar: 'https://example.com/avatar',
    };

         // Mock the initial useEffect call and the create update call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: [],
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           data: mockCreatedUpdate,
         }),
       });

    const { result } = renderHook(() => useCampaignUpdates('1'));

    await act(async () => {
      const created = await result.current.createUpdate(mockUpdateData);
      expect(created).toEqual(mockCreatedUpdate);
    });

    expect(fetch).toHaveBeenCalledWith('/api/campaigns/1/updates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockUpdateData),
    });
  });
});

describe('useCampaignComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty comments, loading true, and no error', () => {
    const { result } = renderHook(() => useCampaignComments('1'));
    
    expect(result.current.comments).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch campaign comments successfully', async () => {
    const mockComments = [
      {
        id: '1',
        campaignId: '1',
        userId: 'user1',
        content: 'Great campaign!',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        userName: 'John Doe',
        userAvatar: 'https://example.com/avatar',
      },
    ];

         // Mock the initial useEffect call and the manual fetch call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: [],
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: mockComments,
         }),
       });

    const { result } = renderHook(() => useCampaignComments('1'));

    await act(async () => {
      await result.current.fetchComments(1);
    });

    expect(result.current.comments).toEqual(mockComments);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
         expect(fetch).toHaveBeenCalledWith('/api/campaigns/1/comments?page=1&limit=10');
  });

  it('should create campaign comment successfully', async () => {
    const mockContent = 'New comment';

    const mockCreatedComment = {
      id: '2',
      campaignId: '1',
      userId: 'user1',
      content: mockContent,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      userName: 'John Doe',
      userAvatar: 'https://example.com/avatar',
    };

         // Mock the initial useEffect call and the create comment call
     (fetch as jest.Mock)
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           success: true,
           data: [],
         }),
       })
       .mockResolvedValueOnce({
         ok: true,
         json: jest.fn().mockResolvedValue({
           data: mockCreatedComment,
         }),
       });

    const { result } = renderHook(() => useCampaignComments('1'));

    await act(async () => {
      const created = await result.current.createComment(mockContent);
      expect(created).toEqual(mockCreatedComment);
    });

    expect(fetch).toHaveBeenCalledWith('/api/campaigns/1/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: mockContent }),
    });
  });
}); 