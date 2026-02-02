<?php

namespace App\Yantrana\Components\WhatsAppService\Controllers;

use App\Yantrana\Base\BaseController;
use App\Yantrana\Components\WhatsAppService\WhatsAppTemplateEngine;

class WhatsAppTemplateController extends BaseController
{
    /**
     * @var WhatsAppTemplateEngine
     */
    protected $whatsAppTemplateEngine;

    /**
     * Constructor
     *
     * @param WhatsAppTemplateEngine $whatsAppTemplateEngine
     */
    public function __construct(WhatsAppTemplateEngine $whatsAppTemplateEngine)
    {
        $this->whatsAppTemplateEngine = $whatsAppTemplateEngine;
    }

    // ... other methods ...

    /**
     * API endpoint to get a single template
     *
     * FIX: Changed from direct property access to using getter method
     * OLD (line 558): $this->whatsAppTemplateEngine->whatsAppTemplateRepository->fetch($templateUid)
     * NEW: $this->whatsAppTemplateEngine->getWhatsAppTemplateRepository()->fetch($templateUid)
     *
     * @param string $vendorUid
     * @param string $templateUid
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiGetTemplate($vendorUid, $templateUid)
    {
        // FIX: Use getter method instead of direct protected property access
        $template = $this->whatsAppTemplateEngine->getWhatsAppTemplateRepository()->fetch($templateUid);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    // ... other existing methods remain unchanged
}
