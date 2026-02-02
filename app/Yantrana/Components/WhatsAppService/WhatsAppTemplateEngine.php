<?php

namespace App\Yantrana\Components\WhatsAppService;

use App\Yantrana\Components\WhatsAppService\Repositories\WhatsAppTemplateRepository;

class WhatsAppTemplateEngine
{
    /**
     * @var WhatsAppTemplateRepository
     */
    protected $whatsAppTemplateRepository;

    /**
     * Constructor
     *
     * @param WhatsAppTemplateRepository $whatsAppTemplateRepository
     */
    public function __construct(WhatsAppTemplateRepository $whatsAppTemplateRepository)
    {
        $this->whatsAppTemplateRepository = $whatsAppTemplateRepository;
    }

    /**
     * Get the WhatsApp template repository instance
     *
     * FIX: Added public getter to access protected repository from controller
     *
     * @return WhatsAppTemplateRepository
     */
    public function getWhatsAppTemplateRepository()
    {
        return $this->whatsAppTemplateRepository;
    }

    // ... other existing methods remain unchanged
}
