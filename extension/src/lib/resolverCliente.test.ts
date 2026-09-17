import { describe, it, expect } from 'vitest';
import { resolverCliente, VinculoWhatsapp, ClienteResumido } from './resolverCliente';

const vinculo = (p: Partial<VinculoWhatsapp>): VinculoWhatsapp => ({
  id: 'v1',
  cliente_id: 'cliente-1',
  lead_id: null,
  chat_titulo: null,
  telefone_e164: null,
  lid: null,
  ...p,
});

const clientes: ClienteResumido[] = [
  { id: 'cliente-1', nome: 'Padaria Central', contato_telefone: '(51) 99212-7961' },
  { id: 'cliente-2', nome: 'Padaria Central 2', contato_telefone: null },
  { id: 'cliente-3', nome: 'Café da Esquina', contato_telefone: '51993943774' },
];

describe('resolverCliente', () => {
  it('o vínculo feito à mão vale mais que tudo', () => {
    const r = resolverCliente(
      { titulo: 'João do mercado', telefone: '51993943774', lid: null },
      [vinculo({ chat_titulo: 'João do mercado', cliente_id: 'cliente-2' })],
      clientes
    );
    expect(r).toEqual({ clienteId: 'cliente-2', comoAchou: 'vinculo-nome', vinculoId: 'v1' });
  });

  it('acha pelo telefone do cadastro, mesmo escrito diferente', () => {
    const r = resolverCliente({ titulo: null, telefone: '5551992127961', lid: null }, [], clientes);
    expect(r).toEqual({ clienteId: 'cliente-1', comoAchou: 'telefone-do-cadastro' });
  });

  it('acha pelo nome igual, ignorando acento e caixa', () => {
    const r = resolverCliente({ titulo: 'CAFE DA ESQUINA', telefone: null, lid: null }, [], clientes);
    expect(r).toEqual({ clienteId: 'cliente-3', comoAchou: 'nome-igual' });
  });

  it('nome parecido não serve', () => {
    const r = resolverCliente({ titulo: 'Padaria Centra', telefone: null, lid: null }, [], clientes);
    expect(r).toBeNull();
  });

  it('dois clientes com o mesmo nome: não escolhe nenhum', () => {
    const doisIguais = [
      { id: 'a', nome: 'Mercadinho' },
      { id: 'b', nome: 'Mercadinho' },
    ];
    const r = resolverCliente({ titulo: 'Mercadinho', telefone: null, lid: null }, [], doisIguais);
    expect(r).toBeNull();
  });

  it('conversa sem nada reconhecível fica sem cliente', () => {
    expect(resolverCliente({ titulo: null, telefone: null, lid: null }, [], clientes)).toBeNull();
  });

  it('vínculo de lead não vira cliente', () => {
    const r = resolverCliente(
      { titulo: 'Contato novo', telefone: null, lid: null },
      [vinculo({ chat_titulo: 'Contato novo', cliente_id: null, lead_id: 'lead-1' })],
      clientes
    );
    expect(r).toBeNull();
  });

  it('o identificador interno vem antes do telefone', () => {
    const r = resolverCliente(
      { titulo: null, telefone: '5551992127961', lid: '123456' },
      [
        vinculo({ id: 'v-lid', lid: '123456', cliente_id: 'cliente-3' }),
        vinculo({ id: 'v-tel', telefone_e164: '+5551992127961', cliente_id: 'cliente-2' }),
      ],
      clientes
    );
    expect(r?.clienteId).toBe('cliente-3');
  });
});
