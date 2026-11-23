import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:seerah_app/core/sentry_filter.dart';

SentryEvent _event(Object? throwable, {List<SentryException>? exceptions}) =>
    SentryEvent(throwable: throwable, exceptions: exceptions);

void main() {
  group('isTransientNetworkError', () {
    test('network exception types are noise', () {
      expect(isTransientNetworkError(const SocketException('reset')), isTrue);
      expect(isTransientNetworkError(const HandshakeException('x')), isTrue);
      expect(isTransientNetworkError(TimeoutException('slow')), isTrue);
      expect(isTransientNetworkError(http.ClientException('x')), isTrue);
    });

    test('audio source failures and font download failures are noise', () {
      expect(
        isTransientNetworkError(
          PlatformException(
            code: 'AndroidAudioError',
            message: 'Failed to set source',
          ),
        ),
        isTrue,
      );
      expect(
        isTransientNetworkError(
          Exception('Failed to load font with url https://fonts.gstatic.com/x'),
        ),
        isTrue,
      );
    });

    test('real bugs are not noise', () {
      expect(isTransientNetworkError(null), isFalse);
      expect(isTransientNetworkError(StateError('boom')), isFalse);
      expect(isTransientNetworkError(ArgumentError('bad')), isFalse);
      expect(
        isTransientNetworkError(
          PlatformException(code: 'other', message: 'unrelated'),
        ),
        isFalse,
      );
    });
  });

  group('dropTransientNetworkNoise', () {
    test('drops events whose throwable is a network error', () {
      expect(
        dropTransientNetworkNoise(
          _event(const SocketException('x')),
          Hint(),
        ),
        isNull,
      );
    });

    test('drops throwable-less events by exception text', () {
      final e = _event(
        null,
        exceptions: [
          SentryException(
            type: 'OSError',
            value: 'OS Error: Connection reset by peer, errno = 104',
          ),
        ],
      );
      expect(dropTransientNetworkNoise(e, Hint()), isNull);
    });

    test('keeps genuine errors', () {
      final e = _event(
        StateError('boom'),
        exceptions: [SentryException(type: 'StateError', value: 'Bad state')],
      );
      expect(dropTransientNetworkNoise(e, Hint()), same(e));
    });
  });
}
